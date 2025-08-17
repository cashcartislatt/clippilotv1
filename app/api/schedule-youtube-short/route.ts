import { NextRequest, NextResponse } from "next/server";
import ytdl from "ytdl-core";
import { instagramGetUrl } from "instagram-url-direct";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import puppeteer from "puppeteer";

// Helper: Download YouTube video
async function downloadYouTubeVideo(url: string, outputPath: string) {
  return new Promise((resolve, reject) => {
    const stream = ytdl(url, { quality: "highestvideo" })
      .pipe(fs.createWriteStream(outputPath));
    stream.on("finish", () => resolve(outputPath));
    stream.on("error", reject);
  });
}

// Helper: Download Instagram video (Puppeteer-based)
async function downloadInstagramVideo(url: string, outputPath: string) {
  // Normalize URL
  const normalizedUrl = url.split("?")[0].split("#")[0];
  let videoUrl = "";
  let metadata = {};
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(normalizedUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Extract video URL
    await page.waitForSelector('meta[property="og:video"]', { timeout: 10000 });
    videoUrl = await page.$eval('meta[property="og:video"]', el => el.getAttribute('content'));
    // Extract metadata
    metadata = await page.evaluate(() => {
      const getMeta = (prop) => {
        const el = document.querySelector(`meta[property='${prop}']`);
        return el ? el.getAttribute('content') : "";
      };
      const caption = getMeta('og:description');
      const author = getMeta('instapp:owner_user_id') || document.querySelector('a[role="link"]')?.textContent || "";
      const videoUrl = getMeta('og:video');
      const thumbnail = getMeta('og:image');
      // Try to get likes/comments if available
      let likes = "";
      let comments = "";
      const likeEl = document.querySelector('section span[aria-label*="like"]');
      if (likeEl) likes = likeEl.textContent;
      const commentEls = document.querySelectorAll('ul ul li');
      comments = Array.from(commentEls).map(el => el.textContent).join(' | ');
      // Post date
      let postDate = "";
      const timeEl = document.querySelector('time');
      if (timeEl) postDate = timeEl.getAttribute('datetime');
      return { caption, author, videoUrl, thumbnail, likes, comments, postDate };
    });
    await browser.close();
  } catch (err) {
    // Fallback to instagram-url-direct if Puppeteer fails
    try {
      const info = await instagramGetUrl(url);
      videoUrl = info?.url_list?.[0];
      metadata = { caption: info?.title || "", videoUrl };
    } catch {}
  }
  if (!videoUrl) throw new Error("No video found at Instagram URL");
  const response = await axios.get(videoUrl, { responseType: "stream" });
  const fileStream = fs.createWriteStream(outputPath);
  await new Promise((resolve, reject) => {
    response.data.pipe(fileStream);
    response.data.on("error", reject);
    fileStream.on("finish", () => resolve(undefined));
    fileStream.on("error", reject);
  });
  return { outputPath, metadata };
}

// Helper: Upload to YouTube Shorts
async function uploadToYouTubeShort({
  filePath,
  title,
  description,
  hashtags,
  publishAt,
  oauth2Client,
}: {
  filePath: string;
  title: string;
  description: string;
  hashtags: string[];
  publishAt: string | null;
  oauth2Client: any;
}) {
  const youtube = google.youtube({ version: "v3", auth: oauth2Client });
  const fullDescription = `${description}\n\n${hashtags.join(" ")}`;
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title,
        description: fullDescription,
        categoryId: "22", // People & Blogs
        tags: hashtags,
      },
      status: {
        privacyStatus: "private",
        publishAt: publishAt || undefined,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });
  return res.data;
}

export async function POST(req: NextRequest) {
  try {
    const urlObj = new URL(req.url);
    const debugDownload = urlObj.searchParams.get("debugDownload") === "1";
    const body = await req.json();
    const { videoLink, title, description, hashtags, scheduleTime, thumbnail, channel } = body;
    if (!videoLink || !title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Missing or empty video title. Please provide a valid title." }, { status: 400 });
    }

    // 1. Download video
    const ext = ".mp4";
    const tempPath = path.join(os.tmpdir(), `clip_${Date.now()}${ext}`);
    let metadata = {};
    if (videoLink.includes("youtube.com") || videoLink.includes("youtu.be")) {
      await downloadYouTubeVideo(videoLink, tempPath);
    } else if (videoLink.includes("instagram.com")) {
      const result = await downloadInstagramVideo(videoLink, tempPath);
      metadata = result.metadata;
    } else {
      return NextResponse.json({ error: "Unsupported video source" }, { status: 400 });
    }

    // 1b. Save thumbnail if provided (base64 or URL)
    let thumbnailPath = "";
    if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("data:image")) {
      // base64 image
      const base64Data = thumbnail.split(",")[1];
      thumbnailPath = path.join(os.tmpdir(), `thumb_${Date.now()}.png`);
      fs.writeFileSync(thumbnailPath, Buffer.from(base64Data, "base64"));
    } else if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("http")) {
      // image URL
      const thumbRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
      thumbnailPath = path.join(os.tmpdir(), `thumb_${Date.now()}.png`);
      fs.writeFileSync(thumbnailPath, Buffer.from(thumbRes.data));
    }

    // Debug: Check if file exists and get size
    let fileSize = 0;
    try {
      const stats = fs.statSync(tempPath);
      fileSize = stats.size;
    } catch (e) {
      return NextResponse.json({ error: "File not found after download" }, { status: 500 });
    }

    if (debugDownload) {
      // Clean up temp file after reporting
      const debugInfo = { tempPath, fileSize };
      fs.unlinkSync(tempPath);
      return NextResponse.json({ success: true, debug: debugInfo });
    }

    // 2. Upload to YouTube Shorts
    // Select refresh token based on channel
    let refreshToken = process.env.YT_REFRESH_TOKEN;
    if (channel === 'channel2') {
      refreshToken = process.env.YT2_REFRESH_TOKEN;
    }
    const oauth2Client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const publishAt = scheduleTime ? new Date(scheduleTime).toISOString() : null;
    const uploadRes = await uploadToYouTubeShort({
      filePath: tempPath,
      title,
      description,
      hashtags,
      publishAt,
      oauth2Client,
    });
    // Set thumbnail if provided and video uploaded
    if (thumbnailPath && uploadRes.id) {
      const youtube = google.youtube({ version: "v3", auth: oauth2Client });
      await youtube.thumbnails.set({
        videoId: uploadRes.id,
        media: {
          body: fs.createReadStream(thumbnailPath),
        },
      });
    }

    // 3. Insert metadata/status into Supabase (stub)
    // TODO: Add Supabase logic here

    // 4. Clean up temp file
    fs.unlinkSync(tempPath);
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    return NextResponse.json({
      success: true,
      youtubeVideoId: uploadRes.id,
      youtubeUrl: `https://youtube.com/shorts/${uploadRes.id}`,
      status: uploadRes.status,
      instagramMetadata: metadata,
      debug: { tempPath, fileSize }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate with OAuth2
    const oauth2Client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.YT_REFRESH_TOKEN });
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    // Get channel ID
    const channelRes = await youtube.channels.list({
      mine: true,
      part: ["id"]
    });
    const channelId = channelRes.data.items?.[0]?.id;
    if (!channelId) {
      return NextResponse.json({ error: "Could not find channel ID" }, { status: 400 });
    }

    // Fetch videos from channel
    const videosRes = await youtube.search.list({
      channelId,
      part: ["id", "snippet"],
      maxResults: 25,
      order: "date",
      type: ["video"]
    });
    const videos = (videosRes.data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.medium?.url || "",
      publishedAt: item.snippet.publishedAt,
    }));
    return NextResponse.json({ success: true, videos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

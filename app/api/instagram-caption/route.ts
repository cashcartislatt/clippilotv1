import { NextRequest, NextResponse } from "next/server";
import { instagramGetUrl } from "instagram-url-direct";
import puppeteer from "puppeteer";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.includes("instagram.com")) {
    return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
  }

  // Normalize Instagram URL (remove query params/fragments)
  const normalizedUrl = url.split("?")[0].split("#")[0];

  // Try Puppeteer scraping first
  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(normalizedUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Wait for main content
    await page.waitForSelector('meta[property="og:description"]', { timeout: 10000 });
    // Try to get caption from meta tag
    const metaCaption = await page.$eval('meta[property="og:description"]', el => el.getAttribute('content'));
    let caption = metaCaption || "";
    // If meta tag fails, try to get from post content
    if (!caption) {
      try {
        caption = await page.$eval('div[data-testid="media-caption-text"]', el => el.textContent) || "";
      } catch {}
    }
    await browser.close();
    return NextResponse.json({ caption });
  } catch (err: any) {
    // Fallback to instagram-url-direct if Puppeteer fails
    try {
      const info = await instagramGetUrl(url);
      const caption = info?.post_info?.caption || "";
      return NextResponse.json({ caption });
    } catch (err2: any) {
      return NextResponse.json({ error: err2.message || "Failed to fetch caption" }, { status: 500 });
    }
  }
}

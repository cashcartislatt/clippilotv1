import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
const cheerio = require("cheerio");

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.includes("instagram.com")) {
    return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
  }

  // Normalize Instagram URL (remove query params/fragments)
  const normalizedUrl = url.split("?")[0].split("#")[0];

  try {
    const response = await axios.get(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    const html = response.data;
    const $ = cheerio.load(html);
    // Try to get caption from meta tag first
    let caption = $('meta[property="og:description"]').attr('content') || "";
    // Try to extract caption from embedded JSON
    if (!caption) {
      // Look for <script type="application/ld+json">
      const ldJson = $('script[type="application/ld+json"]').html();
      if (ldJson) {
        try {
          const ldData = JSON.parse(ldJson);
          if (ldData && ldData.caption) {
            caption = ldData.caption;
          } else if (ldData && ldData.description) {
            caption = ldData.description;
          }
        } catch {}
      }
    }
    // Fallback: Try window._sharedData or other script blobs
    if (!caption) {
      const scripts = $('script').toArray();
      for (const script of scripts) {
        const html = $(script).html();
        if (html && html.includes('window._sharedData')) {
          const match = html.match(/window\._sharedData\s*=\s*(\{.*\});/);
          if (match && match[1]) {
            try {
              const sharedData = JSON.parse(match[1]);
              // Traverse sharedData for caption
              const edges = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media?.edge_media_to_caption?.edges;
              if (edges && edges.length > 0) {
                caption = edges[0].node.text;
                break;
              }
            } catch {}
          }
        }
      }
    }
    // Fallback to previous selectors if still not found
    if (!caption) {
      caption = $('div[data-testid="media-caption-text"]').text() || "";
      if (!caption) {
        caption = $('div.C4VMK > span').first().text() || "";
      }
      if (!caption) {
        caption = $('article span').first().text() || "";
      }
    }
    if (!caption) {
      return NextResponse.json({ error: "Caption not found. The post may be private, restricted, or the page structure has changed." }, { status: 404 });
    }
    return NextResponse.json({ caption });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch caption" }, { status: 500 });
  }
}

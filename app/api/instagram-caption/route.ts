import { NextRequest, NextResponse } from "next/server";
import chromium from "chrome-aws-lambda";
import puppeteer from "puppeteer-core";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || !url.includes("instagram.com")) {
    return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
  }

  // Normalize Instagram URL (remove query params/fragments)
  const normalizedUrl = url.split("?")[0].split("#")[0];

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36");
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(normalizedUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    // Try to get caption from meta tag first
    let caption = "";
    try {
      await page.waitForSelector('meta[property="og:description"]', { timeout: 10000 });
      const metaCaption = await page.$eval('meta[property="og:description"]', el => el.getAttribute('content'));
      caption = metaCaption || "";
    } catch {}
    // If meta tag fails, try to get from post content
    if (!caption) {
      try {
        caption = await page.$eval('div[data-testid="media-caption-text"]', el => el.textContent) || "";
      } catch {}
    }
    await browser.close();
    return NextResponse.json({ caption });
  } catch (err: any) {
    if (browser) await browser.close();
    return NextResponse.json({ error: err.message || "Failed to fetch caption" }, { status: 500 });
  }
}

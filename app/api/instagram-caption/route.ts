import { NextRequest, NextResponse } from "next/server";
import { instagramGetUrl } from "instagram-url-direct";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");
    if (!url || !url.includes("instagram.com")) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }
    const info = await instagramGetUrl(url);
    const caption = info?.post_info?.caption || "";
    return NextResponse.json({ caption });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch caption" }, { status: 500 });
  }
}

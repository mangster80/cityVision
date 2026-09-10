import { NextResponse } from "next/server";

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#201b35"/>
  <path d="M14 46 29 18h7l14 28h-8l-3-7H25l-4 7Zm14-13h8l-4-9Z" fill="#9ce6c0"/>
</svg>`;

export function GET() {
  return new NextResponse(favicon, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

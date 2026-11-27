import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Behpardakht only accepts a POST form to startpay.mellat. This tiny landing
 * page keeps the checkout client simple and forwards the RefId with the
 * required POST body. The RefId is validated before being embedded.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref") ?? "";
  if (!/^[A-Za-z0-9_-]{4,120}$/.test(ref)) {
    return NextResponse.redirect(new URL("/checkout/result?status=failed", request.url));
  }

  const nonce = escapeHtml((await headers()).get("x-nonce") ?? "");
  const safeRef = escapeHtml(ref);
  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>انتقال به درگاه به‌پرداخت ملت</title>
  <style>
    body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f1ed;color:#2b2b2b;font-family:Vazirmatn,Tahoma,sans-serif}
    .card{max-width:380px;padding:32px;text-align:center}
    .spin{width:32px;height:32px;margin:0 auto 20px;border:3px solid #e8e3de;border-top-color:#6b5e57;border-radius:50%;animation:r .8s linear infinite}
    @keyframes r{to{transform:rotate(360deg)}}
    p{font-size:14px;line-height:2;color:#6b6b6b}
    button{margin-top:12px;min-height:44px;border:1px solid #6b5e57;border-radius:14px;background:#6b5e57;color:#fff;padding:0 24px;font:inherit;cursor:pointer}
  </style>
</head>
<body>
  <div class="card">
    <div class="spin" aria-hidden="true"></div>
    <p>در حال انتقال امن به درگاه به‌پرداخت ملت…</p>
    <form id="mellat" method="post" action="https://bpm.shaparak.ir/pgwchannel/startpay.mellat">
      <input type="hidden" name="RefId" value="${safeRef}" />
      <button type="submit">ورود به درگاه پرداخت</button>
    </form>
  </div>
  <script nonce="${nonce}">document.getElementById("mellat").submit();</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store, max-age=0",
      "referrer-policy": "no-referrer",
    },
  });
}

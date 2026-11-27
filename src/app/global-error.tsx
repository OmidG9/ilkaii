"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("global_error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f1ed",
          color: "#2b2b2b",
          fontFamily: "Vazirmatn, Tahoma, system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: "#6b5e57", margin: 0 }}>ilkaii</p>
          <p style={{ fontSize: 96, lineHeight: 1, margin: "32px 0 0", color: "rgba(107,94,87,0.18)", fontWeight: 700 }}>!</p>
          <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 600 }}>مشکلی در بارگذاری فروشگاه پیش آمد</h1>
          <p style={{ margin: "16px auto 0", maxWidth: 420, fontSize: 14, lineHeight: 2, color: "rgba(43,43,43,0.6)" }}>
            صفحه اصلی به‌درستی بارگذاری نشد. لطفاً یک‌بار دیگر تلاش کنید. اگر خطا ادامه داشت، کمی بعد دوباره سر بزنید.
          </p>
          {error.digest ? (
            <p dir="ltr" style={{ margin: "12px 0 0", fontSize: 10, color: "rgba(43,43,43,0.35)" }}>Ref: {error.digest}</p>
          ) : null}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 48,
                border: 0,
                borderRadius: 16,
                padding: "0 24px",
                background: "#6b5e57",
                color: "#fff",
                fontSize: 14,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              تلاش دوباره
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: 48,
                borderRadius: 16,
                padding: "0 24px",
                border: "1px solid #6b5e57",
                color: "#6b5e57",
                fontSize: 14,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              بازگشت به خانه
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

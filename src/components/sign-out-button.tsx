"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          // Hard navigation clears the in-memory cart/session UI state.
          window.location.assign("/");
        }
      }}
      className="w-full justify-start"
    >
      {busy ? "در حال خروج..." : "خروج از حساب"}
    </Button>
  );
}

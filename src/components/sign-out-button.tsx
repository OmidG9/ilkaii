"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
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
          router.push("/");
          router.refresh();
          setBusy(false);
        }
      }}
      className="w-full justify-start"
    >
      {busy ? "در حال خروج..." : "خروج از حساب"}
    </Button>
  );
}

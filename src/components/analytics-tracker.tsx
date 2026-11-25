"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { setAnalyticsAllowed, track } from "@/lib/analytics-client";

/**
 * Emits a page_view on route changes. Product/category/search views are emitted
 * by their own small client components so they can carry domain identifiers.
 */
export function AnalyticsTracker({ allowed }: { allowed: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setAnalyticsAllowed(allowed);
    if (allowed) track("page_view");
    return () => setAnalyticsAllowed(false);
  }, [allowed, pathname, searchParams]);

  return null;
}

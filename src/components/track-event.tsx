"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-types";
import { track, type TrackProperties } from "@/lib/analytics-client";

export function TrackEvent({ name, properties }: { name: AnalyticsEventName; properties?: TrackProperties }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(name, properties);
  }, [name, properties]);
  return null;
}

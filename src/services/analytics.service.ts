// src/services/analytics.service.ts
import { resolveApiBaseUrl } from "../libs/api-base";

export interface TrafficClickPayload {
  actionType: "whatsapp" | "call";
  productId?: string;
  vendorId?: string;
}

const recentClicks = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

export async function trackTrafficClick(
  data: TrafficClickPayload,
): Promise<void> {
  try {
    const key = `${data.actionType}:${data.productId ?? ""}:${data.vendorId ?? ""}`;
    const now = Date.now();
    const lastTime = recentClicks.get(key) ?? 0;

    if (now - lastTime < DEDUPE_WINDOW_MS) {
      return;
    }
    recentClicks.set(key, now);

    const apiUrl = resolveApiBaseUrl();
    const response = await fetch(`${apiUrl}/analytics/track-click`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
      keepalive: true,
    });

    if (!response.ok) {
      console.error("Failed to track traffic click:", response.statusText);
    }
  } catch (error) {
    // Fail silently so it never interrupts user experience
    console.error("Error tracking click:", error);
  }
}
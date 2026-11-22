// src/services/analytics.service.ts
export interface TrafficClickPayload {
  actionType: "whatsapp" | "call";
  productId?: string;
  vendorId?: string;
}

const recentClicks = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

const resolveApiBase = (): string => {
  const isDeployedSite =
    import.meta.env.PROD ||
    (typeof window !== "undefined" &&
      window.location.hostname === "ingeni.onrender.com");

  if (isDeployedSite) {
    return "/api";
  }

  const raw = (
    import.meta.env.VITE_API_URL || "https://ingeri-api.onrender.com/api"
  )
    .trim()
    .replace(/\/+$/, "");

  return raw.endsWith("/api") ? raw : `${raw}/api`;
};

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

    const apiUrl = resolveApiBase();
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
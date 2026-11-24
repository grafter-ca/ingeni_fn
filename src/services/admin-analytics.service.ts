// src/services/admin-analytics.service.ts
import { localApi } from "../libs/api";
import type { TrafficStat } from "../types/admin";

export async function fetchVendorTrafficStats(
  vendorId: string,
): Promise<TrafficStat[]> {
  const cleanId = String(vendorId || "").trim();
  if (!cleanId) {
    return [];
  }

  const result = await localApi.get<any>(
    `/analytics/vendor/${encodeURIComponent(cleanId)}`,
  );

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.stats)) return result.stats;
  return [];
}
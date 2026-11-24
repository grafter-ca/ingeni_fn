// src/services/admin-analytics.service.ts
import { localApi } from "../libs/api";
import type { TrafficStat } from "../types/admin";

export async function fetchVendorTrafficStats(
  vendorId: string,
): Promise<TrafficStat[]> {
  if (!vendorId) {
    return [];
  }
  const result = await localApi.get<any>(`/analytics/vendor/${vendorId}`);
  return Array.isArray(result) ? result : (result?.data ?? []);
}
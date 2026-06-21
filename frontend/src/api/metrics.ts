import { api } from "./client";
import type { AccountMetricsDaily, ContentItem } from "./types";

export async function getAccountMetrics(
  accountId: string,
  limit = 90,
): Promise<AccountMetricsDaily[]> {
  const { data } = await api.get<AccountMetricsDaily[]>(
    `/accounts/${accountId}/metrics`,
    { params: { limit } },
  );
  return data;
}

export async function getAccountContent(
  accountId: string,
  limit = 50,
): Promise<ContentItem[]> {
  const { data } = await api.get<ContentItem[]>(
    `/accounts/${accountId}/content`,
    { params: { limit } },
  );
  return data;
}

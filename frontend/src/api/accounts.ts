import { api } from "./client";
import type {
  AccountConnectRequest,
  AccountSyncResult,
  ConnectedAccount,
} from "./types";

export async function connectAccount(
  payload: AccountConnectRequest,
): Promise<ConnectedAccount> {
  const { data } = await api.post<ConnectedAccount>("/accounts", payload);
  return data;
}

export async function listAccounts(
  clientId?: string,
): Promise<ConnectedAccount[]> {
  const { data } = await api.get<ConnectedAccount[]>("/accounts", {
    params: clientId ? { client_id: clientId } : undefined,
  });
  return data;
}

export async function getAccount(id: string): Promise<ConnectedAccount> {
  const { data } = await api.get<ConnectedAccount>(`/accounts/${id}`);
  return data;
}

export async function deleteAccount(id: string): Promise<void> {
  await api.delete(`/accounts/${id}`);
}

export async function syncAccount(id: string): Promise<AccountSyncResult> {
  const { data } = await api.post<AccountSyncResult>(`/accounts/${id}/sync`);
  return data;
}

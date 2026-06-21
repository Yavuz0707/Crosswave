import { api } from "./client";
import type { LoginRequest, RegisterRequest, Token, User } from "./types";

export async function login(payload: LoginRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<Token> {
  const { data } = await api.post<Token>("/auth/register", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe } from "../api/auth";
import { tokenStore, UNAUTHORIZED_EVENT } from "../api/client";
import type { User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const login = useCallback(async (token: string) => {
    tokenStore.set(token);
    const me = await getMe();
    setUser(me);
  }, []);

  // Bootstrap: if a token exists from a previous session, restore the user.
  useEffect(() => {
    let active = true;
    const token = tokenStore.get();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch(() => {
        if (active) tokenStore.clear();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Drop the session if any request comes back 401.
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

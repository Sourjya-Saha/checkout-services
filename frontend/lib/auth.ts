export interface UserProfile {
  id: string;
  email: string;
  name: string;
  address?: string | null;
  is_guest: boolean;
  created_at?: string | null;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

const TOKEN_KEY = "sentinelops_auth_token";
const USER_KEY = "sentinelops_auth_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("sentinelops_auth_change"));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("sentinelops_auth_change"));
}

const API_BASE = process.env.NEXT_PUBLIC_CHECKOUT_API_URL || "http://127.0.0.1:8000";

export async function loginUser(email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserProfile; token?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Invalid email or password" };
    }

    setAuthSession(data.access_token, data.user);
    return { success: true, user: data.user, token: data.access_token };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to authentication server" };
  }
}

export async function signupUser(email: string, password: string, name?: string, address?: string): Promise<{ success: boolean; error?: string; user?: UserProfile; token?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || "Customer", address: address || "" }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.detail || "Registration failed" };
    }

    setAuthSession(data.access_token, data.user);
    return { success: true, user: data.user, token: data.access_token };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to authentication server" };
  }
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearAuthSession();
      return null;
    }
    const user: UserProfile = await res.json();
    setAuthSession(token, user);
    return user;
  } catch {
    return getStoredUser();
  }
}

// Authentication Client Module matching login.js and publicClient.js

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  token: string;
}

const AUTH_STORAGE_KEY = "sajilo_patra_auth_user";

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuthUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  }
}

export async function loginUser(email: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Login failed" };
    }

    const authUser: AuthUser = {
      id: data.user?.id || `user-${data.username}`,
      email: data.user?.email || email,
      username: data.username || email.split("@")[0],
      token: data.token || data.session?.access_token || `dev-token-${data.username}`,
    };

    setStoredAuthUser(authUser);
    return { user: authUser };
  } catch (err: any) {
    return { error: err.message || "Network error during login" };
  }
}

export async function signupUser(
  email: string,
  password: string,
  username: string
): Promise<{ user?: AuthUser; error?: string }> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, username }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || "Signup failed" };
    }

    const authUser: AuthUser = {
      id: data.user?.id || `user-${data.username}`,
      email: data.user?.email || email,
      username: data.username || username,
      token: data.token || data.session?.access_token || `dev-token-${username}`,
    };

    setStoredAuthUser(authUser);
    return { user: authUser };
  } catch (err: any) {
    return { error: err.message || "Network error during signup" };
  }
}

export function logoutUser(): void {
  setStoredAuthUser(null);
}

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "../lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Verify token and get current user info
  const refreshUser = async () => {
    if (!token) return;

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { user: currentUser } = await response.json();
        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } else {
        // Token is invalid, logout
        logout();
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
      logout();
    }
  };

  // Verify token on mount and periodically
  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === "admin",
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for authenticated API requests
export function useAuthenticatedRequest() {
  const { token } = useAuth();

  return (method: "GET" | "POST" | "PUT" | "DELETE", url: string, data?: unknown) => {
    return apiRequest(method, url, data);
  };
}

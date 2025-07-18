import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";
import { User, LoginCredentials } from "@/types";

// CKDEV-NOTE: AuthContext interface defines all authentication state and methods
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean; // CKDEV-NOTE: Computed from user presence
  isLoading: boolean; // CKDEV-NOTE: Loading state during auth initialization
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// CKDEV-NOTE: AuthProvider manages global authentication state using React Context
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // CKDEV-NOTE: True until auth initialization completes

  // CKDEV-NOTE: Initialize auth on app load - check for existing valid tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          console.log("Found access token, validating...");
          // CKDEV-NOTE: Validate token by fetching user data
          const userData = await api.getMe();
          console.log("Auth validation successful:", userData);
          setUser(userData);
        } else {
          console.log("No access token found");
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // CKDEV-NOTE: Clear invalid tokens on auth failure
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      } finally {
        console.log("Auth initialization complete");
        setIsLoading(false);
      }
    };

    // CKDEV-NOTE: Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn("Auth initialization timeout, forcing loading to false");
      setIsLoading(false);
    }, 5000);

    initializeAuth().finally(() => {
      clearTimeout(timeout);
    });
  }, []);

  // CKDEV-NOTE: Login function - API call handled in api.login with token storage
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.login(credentials);
      setUser(response.user); // CKDEV-NOTE: Update context state on successful login
    } catch (error) {
      throw error; // CKDEV-NOTE: Re-throw for component error handling
    }
  };

  // CKDEV-NOTE: Logout function - clears tokens and resets user state
  const logout = () => {
    api.logout(); // CKDEV-NOTE: Clears localStorage tokens
    setUser(null); // CKDEV-NOTE: Reset context state
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// CKDEV-NOTE: Custom hook for accessing auth context with error boundary
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // CKDEV-NOTE: Runtime check ensures hook is used within provider
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

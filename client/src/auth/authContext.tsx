import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: number;
  username: string;
  role: "buyer" | "farmer" | "driver";
  name: string;
  phone: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setRole: (role: "buyer" | "farmer" | "driver") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      loadUserData(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const loadUserData = async (token: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.name}!`,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
      // Don't re-throw the error to prevent unhandled rejection
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const data = await response.json();
      
      toast({
        title: "Registration successful",
        description: "You can now log in with your credentials",
      });
      
      return data;
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
      // Don't re-throw the error to prevent unhandled rejection
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };
  
  const setRole = (role: "buyer" | "farmer" | "driver") => {
    // For demo purposes, we're allowing role switching without authentication
    // In a real app, this would require proper registration/login
    setUser(prevUser => {
      if (prevUser) {
        return { ...prevUser, role };
      }
      
      // Create a demo user if none exists
      return {
        id: 0,
        username: "demo",
        role,
        name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        phone: "+1234567890"
      };
    });
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        register,
        logout,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

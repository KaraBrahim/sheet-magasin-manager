import React, { createContext, useContext, useState } from "react";
import { User, AuthContextType } from "../types";
import {
  loadGoogleApi,
  isSignedIn,
  signIn,
  signOut,
} from "../lib/googleSheetsApi";
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  const login = async () => {
    try {
      setIsLoading(true);
      await loadGoogleApi();
      const profile = await signIn();
      setUser({
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl(),
      });
      setIsAuthenticated(true);
      toast({
        title: "Signed in successfully",
        description: `Welcome, ${profile.getName()}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Sign-in Error",
        description: "Failed to sign in with Google. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Sign-out Error",
        description: "Failed to sign out. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

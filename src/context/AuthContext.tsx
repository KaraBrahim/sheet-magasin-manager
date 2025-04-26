
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { loadGoogleApi, isSignedIn, signIn, signOut } from '../lib/googleSheetsApi';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initGoogleApi = async () => {
      try {
        await loadGoogleApi();
        
        if (isSignedIn()) {
          const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
          setUser({
            email: profile.getEmail(),
            name: profile.getName(),
            picture: profile.getImageUrl()
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing Google API:', error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: "Failed to initialize Google API. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initGoogleApi();
  }, [toast]);

  const login = async () => {
    try {
      setIsLoading(true);
      const profile = await signIn();
      setUser({
        email: profile.getEmail(),
        name: profile.getName(),
        picture: profile.getImageUrl()
      });
      setIsAuthenticated(true);
      toast({
        title: "Signed in successfully",
        description: `Welcome, ${profile.getName()}!`,
      });
    } catch (error) {
      console.error('Login error:', error);
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
      console.error('Logout error:', error);
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
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

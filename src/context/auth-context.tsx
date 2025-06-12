// src/context/auth-context.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "../storage";

interface AuthContextType {
  isAuthenticated: boolean;
  username?: string;
  password?: string;
  setCredentials: (username: string, password: string) => void;
  logout: (callback?: () => void) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState<string | undefined>(undefined);

  // Check for an existing token on mount (to persist authentication)
  useEffect(() => {
    const token = storage.get("token");
    if (token) {
      setIsAuthenticated(true);

      // Optionally, retrieve username and password from sessionStorage (if stored)
      const storedUsername = sessionStorage.getItem("username") || undefined;
      const storedPassword = sessionStorage.getItem("password") || undefined;
      if (storedUsername && storedPassword) {
        setUsername(storedUsername);
        setPassword(storedPassword);
      }
    }
  }, []);

  const setCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setIsAuthenticated(true);

    // Optionally, store credentials in sessionStorage
    sessionStorage.setItem("username", user);
    sessionStorage.setItem("password", pass);
    // Save a dummy token in localStorage with a TTL (e.g., 30 minutes)
    storage.set("token", "dummy-token", 30);
  };

  const logout = (callback?: () => void) => {
    storage.remove("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");
    setUsername(undefined);
    setPassword(undefined);
    setIsAuthenticated(false);
    if (callback) callback();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        password,
        setCredentials,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

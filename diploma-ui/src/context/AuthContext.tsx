"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { login as apiLogin, register as apiRegister, getProfile, setup2FA, verify2FA, disable2FA } from "@/services/api";
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  twoFARequired: boolean;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setup2FA: () => Promise<any>;
  verify2FA: (token: string) => Promise<void>;
  disable2FA: (password: string, token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (storedToken) {
      setToken(storedToken);
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      // Adapter selon la structure de retour
      setUser({
        id: data.user?.id || data.id,
        email: data.user?.email || data.email,
        firstName: data.user?.first_name || data.firstName || data.user?.firstName,
        lastName: data.user?.last_name || data.lastName || data.user?.lastName,
        role: data.user?.role || data.role,
        ...data.user,
        ...data
      });
    } catch (e: any) {
      setUser(null);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    setLoading(true);
    setError(null);
    setTwoFARequired(false);
    try {
      const res = await apiLogin(email, password);
      if ((res as any).requiresTwoFactor) {
        setTwoFARequired(true);
        return;
      }
      setToken(res.token);
      localStorage.setItem("token", res.token);
      await fetchProfile();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRegister(data);
      setToken(res.token);
      localStorage.setItem("token", res.token);
      await fetchProfile();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTwoFARequired(false);
    localStorage.removeItem("token");
    router.replace('/login');
  };

  // 2FA
  const handleSetup2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      return await setup2FA();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  const handleVerify2FA = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      await verify2FA(token);
      await fetchProfile();
      setTwoFARequired(false);
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };
  const handleDisable2FA = async (password: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      await disable2FA(password, token);
      await fetchProfile();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, twoFARequired, login, register, logout, fetchProfile, setup2FA: handleSetup2FA, verify2FA: handleVerify2FA, disable2FA: handleDisable2FA }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
} 
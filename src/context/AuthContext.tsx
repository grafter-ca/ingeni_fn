// src/context/AuthContext.tsx
import React, { createContext, useReducer, useCallback, useMemo, useEffect, useContext } from "react";
import { authService } from "../services/auth.service";
import { authReducer, initialAuthState } from "../reducers/userReducer";
import type { LoginPayload, RegisterPayloadProps, UserRole } from "../types/api";

// --- Types for Actions & State ---
interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (payload: LoginPayload, token?: string) => Promise<UserRole>;
  register: (payload: RegisterPayloadProps) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  vendor: {
    create: (name: string, slug: string) => Promise<any>;
    switch: (orgId: string) => Promise<void>;
  };
  admin: {
    listUsers: (query?: any) => Promise<any>;
    setRole: (userId: string, role: UserRole) => Promise<void>;
  };
}

const AuthStateContext = createContext<AuthState>({
  ...initialAuthState,
  isLoading: true,
});

const AuthActionsContext = createContext<AuthActions | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);
  const { data: session, isPending } = authService.useSession();

  // Sync Session with Reducer whenever session changes or resolves
  useEffect(() => {
    if (isPending) return;
    
    if (session?.user) {
      dispatch({ 
        type: "LOGIN_SUCCESS", 
        payload: { ...session.user, role: (session.user.role as UserRole) || 'user' } 
      });
    } else {
      dispatch({ type: "LOGOUT" });
    }
  }, [session, isPending]);

  // --- Namespace: Core Auth ---
  const login = useCallback(async (payload: LoginPayload, token?: string): Promise<UserRole> => {
    dispatch({ type: "LOGIN_START" });
    const response = await authService.signIn(payload, token);
    
    if (response?.error) {
      const errorMsg = response.error.message || "Login Failed";
      dispatch({ type: "LOGIN_ERROR", payload: errorMsg });
      throw new Error(errorMsg);
    }

    const loggedInUser = response.data?.user || response.data;
    const userRole = (loggedInUser?.role as UserRole) || 'user';

    dispatch({ 
      type: "LOGIN_SUCCESS", 
      payload: { ...loggedInUser, role: userRole } 
    });

    return userRole;
  }, []);

  const register = useCallback(async (payload: RegisterPayloadProps) => {
    dispatch({ type: "LOGIN_START" });
    const response = await authService.signUp(payload);
    
    if (response?.error) {
      const errorMsg = response.error.message || "Registration Failed";
      dispatch({ type: "LOGIN_ERROR", payload: errorMsg });
      throw new Error(errorMsg);
    }

    dispatch({ type: "LOGOUT" });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.signOut();
    } finally {
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    await authService.updateUser(data);
    dispatch({ type: "UPDATE_USER", payload: data });
  }, []);

  // --- Namespace: Vendor / Organization Actions ---
  const vendorActions = useMemo(() => ({
    create: async (name: string, slug: string) => {
      return await authService.createOrganization(name, slug);
    },
    switch: async (orgId: string) => {
      await authService.setActiveOrg(orgId);
    }
  }), []);

  // --- Namespace: Admin Actions ---
  const adminActions = useMemo(() => ({
    listUsers: async (query?: any) => {
      return await authService.adminListUsers(query);
    },
    setRole: async (userId: string, role: UserRole) => {
      await authService.adminSetRole(userId, role);
    }
  }), []);

  // Combine actions
  const actions = useMemo(() => ({
    login,
    register,
    logout,
    updateProfile,
    vendor: vendorActions,
    admin: adminActions
  }), [login, register, logout, updateProfile, vendorActions, adminActions]);

  // Combine state values, injecting explicit isLoading based on session hook state
  const memoizedState = useMemo(() => ({
    ...state,
    isLoading: isPending,
  }), [state, isPending]);

  return (
    <AuthStateContext.Provider value={memoizedState}>
      <AuthActionsContext.Provider value={actions}>
        {children}
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};

// --- Custom Hooks for Consumption ---
export const useAuthState = () => {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error("useAuthState must be used within an AuthProvider");
  }
  return context;
};

export const useAuthActions = () => {
  const context = useContext(AuthActionsContext);
  if (!context) {
    throw new Error("useAuthActions must be used within an AuthProvider");
  }
  return context;
};
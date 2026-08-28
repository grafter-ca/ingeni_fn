import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "../../context/AuthContext";
import AuthPromptModal from "./AuthPromptModal";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import type { UserRole } from "../../types/api";

type Props = { 
  children?: React.ReactNode; 
  requiredRole?: UserRole;
};

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, isLoading, isAuthenticated } = useAuthState();
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    navigate(-1);
  }, [navigate]);

  // Sync modal visibility with auth state
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShowModal(true);
    }
  }, [isAuthenticated, isLoading]);

  // 1. Loading Guard: Prevents UI flickering during session rehydration
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // 2. Authorization Guard
  if (isAuthenticated && user) {
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    return children ? <>{children}</> : <Outlet />;
  }

  // 3. Guest/Locked State: Blurred UI and Auth Modal
  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#0a0a0a]">
      <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] flex flex-col items-center justify-center blur-md pointer-events-none select-none px-4 text-center">
         <div className="p-8 bg-white dark:bg-[#121212] rounded-3xl shadow-xl max-w-sm border border-zinc-100 dark:border-white/5">
            <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4 mx-auto animate-pulse" />
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2 mx-auto animate-pulse" />
            <p className="text-zinc-400 dark:text-zinc-500 font-medium font-poppins">Please sign in to access this section</p>
         </div>
      </div>
      
      <AuthPromptModal 
        isOpen={showModal} 
        onClose={handleCloseModal} 
      />
    </div>
  );
};

export default ProtectedRoute;
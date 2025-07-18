import { useAuth as useAuthContext } from "@/contexts/AuthContext";

// CKDEV-NOTE: Re-export auth context hook for cleaner imports in components
export const useAuth = useAuthContext;

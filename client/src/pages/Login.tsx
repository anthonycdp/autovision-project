import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "wouter";
import { TravelConnectSignIn } from "@/components/ui/travel-connect-signin";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  const handleSignIn = async (email: string, password: string) => {
    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer login",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    toast({
      title: "Google Sign In",
      description: "Funcionalidade de login com Google não está disponível no momento.",
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <TravelConnectSignIn
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        title="Autovision"
        subtitle="Sistema de Gerenciamento de Concessionária - Acesse seu painel administrativo"
      />
    </div>
  );
}
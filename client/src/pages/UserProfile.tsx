import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Camera, 
  Mail, 
  Phone, 
  Shield, 
  Lock, 
  Bell, 
  Palette,
  Activity,
  Calendar,
  Edit3,
  Save,
  Upload,
  Settings,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ActivityLog } from "@shared/schema";
import { Link } from "wouter";

// CKDEV-NOTE: Enhanced profile schema with better validation for modern UI
const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  profileImageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional().or(z.literal("")),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

// CKDEV-NOTE: Modern UserProfile component with enhanced UX and responsive design
export default function UserProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // CKDEV-NOTE: State management for modern UI interactions
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [showActivityLogs, setShowActivityLogs] = useState(false);

  // CKDEV-NOTE: React Query for efficient data fetching with caching
  const { data: activityLogs, isLoading: logsLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
    enabled: showActivityLogs,
  });

  // CKDEV-NOTE: React Hook Form with Zod validation for type safety
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      profileImageUrl: user?.profileImageUrl || "",
      password: "",
      confirmPassword: "",
    },
  });

  // CKDEV-NOTE: Optimistic mutation for better user experience
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => {
      const { confirmPassword, ...updateData } = data;
      if (!updateData.password) {
        delete updateData.password;
      }
      return apiRequest("PUT", "/api/profile", updateData);
    },
    onSuccess: () => {
      toast({
        title: "✅ Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsEditing(false);
      form.reset({
        ...form.getValues(),
        password: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  // CKDEV-NOTE: Form submission handler with loading state
  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  // CKDEV-NOTE: Avatar upload handler - placeholder for future file upload implementation
  const handleAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  // CKDEV-TODO: Implement actual file upload to server/cloud storage
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Placeholder - would implement actual file upload here
      toast({
        title: "🚧 Em desenvolvimento",
        description: "Upload de arquivo será implementado em breve",
      });
    }
  };

  // CKDEV-NOTE: Date formatting utility for Brazilian locale
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // CKDEV-NOTE: Action label mapping for activity logs
  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      "LOGIN": "🔑 Login realizado",
      "LOGOUT": "🚪 Logout realizado",
      "CREATE_VEHICLE": "🚗 Veículo criado",
      "UPDATE_VEHICLE": "✏️ Veículo atualizado",
      "DELETE_VEHICLE": "🗑️ Veículo deletado",
      "APPROVE_VEHICLE": "✅ Veículo aprovado",
      "REJECT_VEHICLE": "❌ Veículo rejeitado",
      "UPDATE_PROFILE": "👤 Perfil atualizado",
      "GENERATE_DESCRIPTION": "🤖 Descrição gerada",
    };
    return labels[action] || action;
  };

  // CKDEV-NOTE: Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hover:bg-primary/10 hover:text-primary transition-colors rounded-xl"
              >
                <Link href="/dashboard">
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar ao Dashboard
                </Link>
              </Button>
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                  <User size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-800">Perfil do Usuário</h1>
                  <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setShowActivityLogs(!showActivityLogs)}
              >
                <Activity className="w-4 h-4 mr-2" />
                {showActivityLogs ? "Ocultar" : "Ver"} Atividades
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* AIDEV-NOTE: Modern header with gradient background and user prominence */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* AIDEV-NOTE: Large avatar with upload functionality */}
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarImage 
                  src={user?.profileImageUrl} 
                  alt={user?.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                  {user?.name ? getUserInitials(user.name) : "AU"}
                </AvatarFallback>
              </Avatar>
              
              {/* AIDEV-NOTE: Upload overlay with smooth hover transition */}
              <button
                onClick={handleAvatarUpload}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 
                         transition-all duration-300 flex items-center justify-center"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* AIDEV-NOTE: User info with modern typography */}
            <div className="text-center md:text-left text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {user?.name || "Usuário"}
              </h1>
              <p className="text-xl text-blue-100 mb-4 flex items-center justify-center md:justify-start gap-2">
                <Mail className="h-5 w-5" />
                {user?.email}
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Badge 
                  variant={user?.type === "admin" ? "default" : "secondary"}
                  className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {user?.type === "admin" ? "Administrador" : "Usuário Comum"}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Membro desde {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with modern card layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* AIDEV-NOTE: Personal Information Section - Enhanced form design */}
          <div className="xl:col-span-2 space-y-8">
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <User className="w-6 h-6 mr-3 text-blue-600" />
                    Informações Pessoais
                  </CardTitle>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="transition-all duration-200"
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* AIDEV-NOTE: Enhanced form fields with better UX */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                        Nome Completo
                      </Label>
                      <Input
                        id="name"
                        {...form.register("name")}
                        disabled={!isEditing}
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        placeholder="Seu nome completo"
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          ⚠️ {form.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register("email")}
                        disabled={!isEditing}
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        placeholder="seu@email.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          ⚠️ {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        {...form.register("phone")}
                        disabled={!isEditing}
                        className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="profileImageUrl" className="text-sm font-semibold text-gray-700">
                        URL da Foto de Perfil
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="profileImageUrl"
                          {...form.register("profileImageUrl")}
                          disabled={!isEditing}
                          className="h-12 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                          placeholder="https://exemplo.com/foto.jpg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAvatarUpload}
                          disabled={!isEditing}
                          className="px-3"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* AIDEV-NOTE: Password section with enhanced security UX */}
                  {isEditing && (
                    <>
                      <Separator className="my-6" />
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                        <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Alterar Senha
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                              Nova Senha
                            </Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...form.register("password")}
                                className="h-12 pr-12"
                                placeholder="Deixe em branco para manter"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {form.formState.errors.password && (
                              <p className="text-sm text-red-500">
                                {form.formState.errors.password.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                              Confirmar Nova Senha
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                {...form.register("confirmPassword")}
                                className="h-12 pr-12"
                                placeholder="Confirme a nova senha"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {form.formState.errors.confirmPassword && (
                              <p className="text-sm text-red-500">
                                {form.formState.errors.confirmPassword.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* AIDEV-NOTE: Submit button with loading state */}
                  {isEditing && (
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* AIDEV-NOTE: Sidebar with account settings and activity */}
          <div className="space-y-8">
            
            {/* AIDEV-NOTE: Account Settings Card */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center text-xl">
                  <Settings className="w-6 h-6 mr-3 text-purple-600" />
                  Configurações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* AIDEV-TODO: Implement actual theme switching functionality */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Tema Escuro</p>
                      <p className="text-sm text-gray-500">Alternar aparência</p>
                    </div>
                  </div>
                  <Switch 
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>

                <Separator />

                {/* AIDEV-TODO: Implement notification preferences */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Notificações</p>
                      <p className="text-sm text-gray-500">Receber alertas</p>
                    </div>
                  </div>
                  <Switch 
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                {/* AIDEV-NOTE: Account security options */}
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Configurações de Segurança
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AIDEV-NOTE: Activity History Card with modern design */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl">
                    <Activity className="w-6 h-6 mr-3 text-green-600" />
                    Atividades Recentes
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowActivityLogs(!showActivityLogs)}
                    className="transition-all duration-200"
                  >
                    {showActivityLogs ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              </CardHeader>
              
              {showActivityLogs && (
                <CardContent className="p-6">
                  {logsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : activityLogs && activityLogs.length > 0 ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {activityLogs.slice(0, 15).map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{getActionLabel(log.action)}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(log.createdAt.toString())}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {log.resourceType}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhuma atividade recente</p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
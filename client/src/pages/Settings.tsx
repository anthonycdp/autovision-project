import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  User, 
  Shield, 
  Bell, 
  Globe, 
  Database, 
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2
} from "lucide-react";

// CKDEV-NOTE: Settings page with tabbed interface for system configuration
// CKDEV-TODO: Add real-time validation for all form fields
export default function Settings() {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // CKDEV-NOTE: Settings state uses hardcoded defaults for demonstration
  // CKDEV-TODO: Load actual settings from backend on component mount
  const [generalSettings, setGeneralSettings] = useState({
    companyName: "Autovision",
    companyEmail: "contato@autovision.com",
    companyPhone: "(11) 9999-9999",
    address: "Rua das Flores, 123 - São Paulo, SP",
    website: "https://autovision.com",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    currency: "BRL"
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    salesNotifications: true,
    systemNotifications: true,
    weeklyReports: false,
    monthlyReports: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginNotifications: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 5
  });

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    backupFrequency: "daily",
    dataRetention: 365,
    maintenanceMode: false,
    debugMode: false,
    cacheEnabled: true
  });

  // CKDEV-NOTE: Save and reset handlers show mock success messages
  // CKDEV-TODO: Implement actual API calls to persist settings
  const handleSave = (section: string) => {
    toast({
      title: "Configurações salvas",
      description: `Configurações de ${section} foram salvas com sucesso!`,
    });
  };

  const handleReset = (section: string) => {
    toast({
      title: "Configurações resetadas",
      description: `Configurações de ${section} foram resetadas para o padrão.`,
    });
  };

  const handleExport = () => {
    toast({
      title: "Exportando configurações",
      description: "As configurações estão sendo exportadas...",
    });
  };

  const handleImport = () => {
    toast({
      title: "Importando configurações",
      description: "As configurações foram importadas com sucesso!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-800">Configurações</h1>
              <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* CKDEV-NOTE: Tabs with modern rounded styling and active state shadows */}
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-xl">
            <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Geral</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Notificações</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Segurança</TabsTrigger>
            <TabsTrigger value="system" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Sistema</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <Globe className="w-5 h-5 text-primary" />
                  <span>Configurações Gerais</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nome da Empresa</Label>
                      <Input
                        id="companyName"
                        value={generalSettings.companyName}
                        onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Email da Empresa</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={generalSettings.companyEmail}
                        onChange={(e) => setGeneralSettings({...generalSettings, companyEmail: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Telefone</Label>
                      <Input
                        id="companyPhone"
                        value={generalSettings.companyPhone}
                        onChange={(e) => setGeneralSettings({...generalSettings, companyPhone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={generalSettings.website}
                        onChange={(e) => setGeneralSettings({...generalSettings, website: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Textarea
                      id="address"
                      value={generalSettings.address}
                      onChange={(e) => setGeneralSettings({...generalSettings, address: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <Select value={generalSettings.timezone} onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                          <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                          <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <Select value={generalSettings.language} onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Moeda</Label>
                      <Select value={generalSettings.currency} onValueChange={(value) => setGeneralSettings({...generalSettings, currency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BRL">Real (BRL)</SelectItem>
                          <SelectItem value="USD">Dólar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => handleReset("geral")} className="rounded-xl">
                      <RefreshCw size={16} className="mr-2" />
                      Resetar
                    </Button>
                    <Button onClick={() => handleSave("geral")} className="rounded-xl">
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <Bell className="w-5 h-5 text-primary" />
                  <span>Configurações de Notificação</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Notificações por Email</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações importantes por email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Notificações Push</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações no navegador</p>
                      </div>
                      <Switch
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Notificações SMS</h4>
                        <p className="text-sm text-muted-foreground">Receber notificações por SMS</p>
                      </div>
                      <Switch
                        checked={notificationSettings.smsNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Notificações de Vendas</h4>
                        <p className="text-sm text-muted-foreground">Ser notificado sobre vendas e reservas</p>
                      </div>
                      <Switch
                        checked={notificationSettings.salesNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, salesNotifications: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Notificações do Sistema</h4>
                        <p className="text-sm text-muted-foreground">Receber alertas sobre o sistema</p>
                      </div>
                      <Switch
                        checked={notificationSettings.systemNotifications}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, systemNotifications: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Relatórios Semanais</h4>
                        <p className="text-sm text-muted-foreground">Receber relatórios semanais por email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.weeklyReports}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Relatórios Mensais</h4>
                        <p className="text-sm text-muted-foreground">Receber relatórios mensais por email</p>
                      </div>
                      <Switch
                        checked={notificationSettings.monthlyReports}
                        onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, monthlyReports: checked})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => handleReset("notificações")} className="rounded-xl">
                      <RefreshCw size={16} className="mr-2" />
                      Resetar
                    </Button>
                    <Button onClick={() => handleSave("notificações")} className="rounded-xl">
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Configurações de Segurança</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Autenticação de Dois Fatores</h4>
                        <p className="text-sm text-muted-foreground">Adicionar uma camada extra de segurança</p>
                      </div>
                      <Switch
                        checked={securitySettings.twoFactorAuth}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Notificações de Login</h4>
                        <p className="text-sm text-muted-foreground">Ser notificado sobre novos logins</p>
                      </div>
                      <Switch
                        checked={securitySettings.loginNotifications}
                        onCheckedChange={(checked) => setSecuritySettings({...securitySettings, loginNotifications: checked})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="sessionTimeout">Timeout da Sessão (minutos)</Label>
                      <Input
                        id="sessionTimeout"
                        type="number"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordExpiry">Expiração da Senha (dias)</Label>
                      <Input
                        id="passwordExpiry"
                        type="number"
                        value={securitySettings.passwordExpiry}
                        onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Máx. Tentativas de Login</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => handleReset("segurança")} className="rounded-xl">
                      <RefreshCw size={16} className="mr-2" />
                      Resetar
                    </Button>
                    <Button onClick={() => handleSave("segurança")} className="rounded-xl">
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Configurações do Sistema</span>
                </CardTitle>
              </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Backup Automático</h4>
                        <p className="text-sm text-muted-foreground">Fazer backup automático dos dados</p>
                      </div>
                      <Switch
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => setSystemSettings({...systemSettings, autoBackup: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Modo de Manutenção</h4>
                        <p className="text-sm text-muted-foreground">Ativar modo de manutenção</p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Modo Debug</h4>
                        <p className="text-sm text-muted-foreground">Ativar logs detalhados para debug</p>
                      </div>
                      <Switch
                        checked={systemSettings.debugMode}
                        onCheckedChange={(checked) => setSystemSettings({...systemSettings, debugMode: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-800">Cache Habilitado</h4>
                        <p className="text-sm text-muted-foreground">Usar cache para melhorar performance</p>
                      </div>
                      <Switch
                        checked={systemSettings.cacheEnabled}
                        onCheckedChange={(checked) => setSystemSettings({...systemSettings, cacheEnabled: checked})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="backupFrequency">Frequência do Backup</Label>
                      <Select value={systemSettings.backupFrequency} onValueChange={(value) => setSystemSettings({...systemSettings, backupFrequency: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">A cada hora</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                          <SelectItem value="monthly">Mensalmente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataRetention">Retenção de Dados (dias)</Label>
                      <Input
                        id="dataRetention"
                        type="number"
                        value={systemSettings.dataRetention}
                        onChange={(e) => setSystemSettings({...systemSettings, dataRetention: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button variant="outline" onClick={() => handleReset("sistema")} className="rounded-xl">
                      <RefreshCw size={16} className="mr-2" />
                      Resetar
                    </Button>
                    <Button onClick={() => handleSave("sistema")} className="rounded-xl">
                      <Save size={16} className="mr-2" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>

            {/* Backup & Export */}
            <Card className="bg-white shadow-sm rounded-2xl border border-muted">
              <CardHeader>
                <CardTitle className="text-zinc-800">Backup e Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button variant="outline" onClick={handleExport} className="flex-1 rounded-xl">
                    <Download size={16} className="mr-2" />
                    Exportar Configurações
                  </Button>
                  <Button variant="outline" onClick={handleImport} className="flex-1 rounded-xl">
                    <Upload size={16} className="mr-2" />
                    Importar Configurações
                  </Button>
                </div>
                <div className="border-t pt-4">
                  <Button variant="destructive" className="w-full rounded-xl">
                    <Trash2 size={16} className="mr-2" />
                    Resetar Todas as Configurações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
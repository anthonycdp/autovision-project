import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  BellOff, 
  Check, 
  X, 
  Clock,
  User,
  Car,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  category: 'system' | 'vehicle' | 'user' | 'sales';
  priority: 'low' | 'medium' | 'high';
}

// Mock data - in a real app, this would come from the API
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Veículo Vendido',
    message: 'Honda Civic 2020 foi vendido com sucesso para João Silva',
    time: '2 minutos atrás',
    isRead: false,
    category: 'sales',
    priority: 'high'
  },
  {
    id: '2',
    type: 'info',
    title: 'Novo Usuário Registrado',
    message: 'Maria Santos se registrou no sistema',
    time: '15 minutos atrás',
    isRead: false,
    category: 'user',
    priority: 'medium'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Reserva Prestes a Expirar',
    message: 'A reserva do Toyota Corolla 2021 expira em 2 horas',
    time: '1 hora atrás',
    isRead: true,
    category: 'vehicle',
    priority: 'high'
  },
  {
    id: '4',
    type: 'error',
    title: 'Erro no Sistema',
    message: 'Falha ao processar pagamento para Pedro Costa',
    time: '2 horas atrás',
    isRead: false,
    category: 'system',
    priority: 'high'
  },
  {
    id: '5',
    type: 'info',
    title: 'Novo Veículo Adicionado',
    message: 'Ford Focus 2022 foi adicionado ao inventário',
    time: '3 horas atrás',
    isRead: true,
    category: 'vehicle',
    priority: 'low'
  },
  {
    id: '6',
    type: 'success',
    title: 'Backup Concluído',
    message: 'Backup automático dos dados foi concluído com sucesso',
    time: '1 dia atrás',
    isRead: true,
    category: 'system',
    priority: 'low'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedTab, setSelectedTab] = useState("all");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vehicle':
        return <Car className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      case 'sales':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (selectedTab === "all") return true;
    if (selectedTab === "unread") return !notification.isRead;
    if (selectedTab === "read") return notification.isRead;
    return notification.category === selectedTab;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">
      {/* Header */}
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
                  <Bell size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-semibold text-zinc-800">Notificações</h1>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="px-3 py-1 rounded-full font-medium">
                        {unreadCount} não lidas
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Central de notificações do sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={markAllAsRead} className="shadow-sm hover:shadow-md transition-all duration-300 font-medium">
                <Check size={18} className="mr-2" />
                Marcar Todas como Lidas
              </Button>
              <Button variant="outline" className="shadow-sm hover:shadow-md transition-all duration-300 font-medium">
                <Settings size={18} className="mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1 bg-gray-100 p-2 rounded-2xl">
              <TabsTrigger value="all" className="rounded-xl font-medium transition-all duration-300">Todas</TabsTrigger>
              <TabsTrigger value="unread" className="rounded-xl font-medium transition-all duration-300">Não Lidas</TabsTrigger>
              <TabsTrigger value="read" className="rounded-xl font-medium transition-all duration-300">Lidas</TabsTrigger>
              <TabsTrigger value="system" className="rounded-xl font-medium transition-all duration-300">Sistema</TabsTrigger>
              <TabsTrigger value="vehicle" className="rounded-xl font-medium transition-all duration-300">Veículos</TabsTrigger>
              <TabsTrigger value="user" className="rounded-xl font-medium transition-all duration-300">Usuários</TabsTrigger>
              <TabsTrigger value="sales" className="rounded-xl font-medium transition-all duration-300">Vendas</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-6">
              {/* Notifications List */}
              <Card className="bg-white shadow-xl rounded-3xl border-0">
                <CardHeader className="px-8 pt-8 pb-6">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <span>Notificações ({filteredNotifications.length})</span>
                    </div>
                    <Badge variant="secondary" className="px-3 py-1 rounded-full font-medium">
                      {unreadCount} não lidas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="space-y-3">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                          <BellOff size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma notificação</h3>
                        <p className="text-gray-500 max-w-md mx-auto">Não há notificações para mostrar neste momento.</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`group bg-white border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                            notification.isRead 
                              ? 'border-gray-100' 
                              : 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`p-3 rounded-xl ${
                                notification.type === 'success' ? 'bg-green-100' :
                                notification.type === 'warning' ? 'bg-yellow-100' :
                                notification.type === 'error' ? 'bg-red-100' :
                                'bg-blue-100'
                              }`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {notification.title}
                                  </h4>
                                  <Badge className={`text-xs font-medium px-3 py-1 rounded-full ${
                                    notification.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {notification.priority}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    {getCategoryIcon(notification.category)}
                                    <span className="text-sm text-gray-500 capitalize font-medium">
                                      {notification.category}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">
                                    {notification.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="hover:text-green-600 hover:bg-green-50 rounded-lg"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="hover:text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Notification Settings */}
          <Card className="bg-white shadow-xl rounded-3xl border-0">
            <CardHeader className="px-8 pt-8 pb-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-xl">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <span>Configurações de Notificação</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-8">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-xl">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Email</h4>
                    <p className="text-sm text-gray-500">Receber notificações por email</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-3 rounded-xl">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">SMS</h4>
                    <p className="text-sm text-gray-500">Receber notificações por SMS</p>
                  </div>
                </div>
                <Switch
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
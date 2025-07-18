import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Home, 
  BarChart3, 
  FileText, 
  Bell, 
  User, 
  Settings, 
  HelpCircle,
  Car,
  Users,
  GitCompare,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.type === "admin";
  
  const navigationItems = [
    { 
      icon: Home, 
      label: "Painel", 
      href: "/", 
      active: location === "/" 
    },
    { 
      icon: BarChart3, 
      label: "Análises", 
      href: "/analytics", 
      active: location === "/analytics" 
    },
    { 
      icon: Car, 
      label: "Veículos", 
      href: "/vehicles", 
      active: location.startsWith("/vehicles") && !location.startsWith("/my-vehicles")
    },
    { 
      icon: User, 
      label: "Meus Veículos", 
      href: "/my-vehicles", 
      active: location.startsWith("/my-vehicles") 
    },
    { 
      icon: GitCompare, 
      label: "Comparar", 
      href: "/vehicles/compare", 
      active: location === "/vehicles/compare" 
    },
    ...(isAdmin ? [
      { 
        icon: Users, 
        label: "Usuários", 
        href: "/admin/users", 
        active: location === "/admin/users" 
      },
      { 
        icon: Clock, 
        label: "Aprovações", 
        href: "/admin/approval", 
        active: location === "/admin/approval",
        badge: "2"
      }
    ] : []),
    { 
      icon: FileText, 
      label: "Documentos", 
      href: "/documents", 
      active: location === "/documents",
      badge: "3"
    },
    { 
      icon: Bell, 
      label: "Notificações", 
      href: "/notifications", 
      active: location === "/notifications",
      badge: "12"
    },
    { 
      icon: User, 
      label: "Perfil", 
      href: "/profile", 
      active: location === "/profile" 
    },
    { 
      icon: Settings, 
      label: "Configurações", 
      href: "/settings", 
      active: location === "/settings" 
    },
    { 
      icon: HelpCircle, 
      label: "Ajuda & Suporte", 
      href: "/help", 
      active: location === "/help" 
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 relative`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Autovision</h2>
                <p className="text-xs text-gray-500">Painel Administrativo</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer
                ${item.active 
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}>
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.type}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="w-full mt-3 text-gray-600 hover:text-red-600"
          >
            Sair
          </Button>
        )}
      </div>
    </div>
  );
}
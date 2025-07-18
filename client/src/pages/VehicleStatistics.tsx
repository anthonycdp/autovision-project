import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import { StatusChart, SalesChart } from "@/components/Charts";
import { ArrowLeft, Car, CheckCircle, Handshake, DollarSign, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";

const statTypeLabels = {
  total: "Total de Veículos",
  available: "Veículos Disponíveis",
  reserved: "Veículos Reservados",
  sold: "Veículos Vendidos",
  average: "Preço Médio"
};

const statDescriptions = {
  total: "Análise completa do inventário total de veículos",
  available: "Detalhes dos veículos disponíveis para venda",
  reserved: "Informações sobre veículos reservados",
  sold: "Histórico e análise de vendas",
  average: "Análise de preços e tendências do mercado"
};

export default function VehicleStatistics() {
  const { user } = useAuth();
  const [statType, setStatType] = useState<string>("");

  // Get stat type from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type && ['total', 'available', 'reserved', 'sold', 'average'].includes(type)) {
      setStatType(type);
    }
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => api.getStats(),
  });

  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/stats/vehicles-by-status"],
    queryFn: () => api.getVehiclesByStatus(),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/stats/sales"],
    queryFn: () => api.getSalesData(),
  });

  const currentStatType = statType as keyof typeof statTypeLabels;

  const getStatValue = (type: string) => {
    if (!stats) return 0;
    switch (type) {
      case 'total':
        return stats.totalVehicles;
      case 'available':
        return stats.availableVehicles;
      case 'reserved':
        return stats.reservedVehicles;
      case 'sold':
        return stats.soldVehicles;
      case 'average':
        return stats.averagePrice;
      default:
        return 0;
    }
  };

  const renderDetailedAnalysis = () => {
    if (!currentStatType) return null;

    const value = getStatValue(currentStatType);
    
    return (
      <div className="grid gap-6">
        {/* Main Metric Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Métrica Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {currentStatType === 'average' ? formatCurrency(value) : value.toLocaleString('pt-BR')}
              </div>
              <p className="text-lg text-gray-600">
                {statTypeLabels[currentStatType]}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {statusData && !statusLoading ? (
                  <StatusChart data={statusData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="animate-pulse">Carregando gráfico...</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {salesData && !salesLoading ? (
                  <SalesChart data={salesData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="animate-pulse">Carregando gráfico...</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total de Veículos"
                value={stats?.totalVehicles || 0}
                icon={<Car size={24} />}
                color="primary"
              />
              <StatsCard
                title="Disponíveis"
                value={stats?.availableVehicles || 0}
                icon={<CheckCircle size={24} />}
                color="success"
              />
              <StatsCard
                title="Reservados"
                value={stats?.reservedVehicles || 0}
                icon={<Handshake size={24} />}
                color="warning"
              />
              <StatsCard
                title="Preço Médio"
                value={stats?.averagePrice ? formatCurrency(stats.averagePrice) : "R$ 0"}
                icon={<DollarSign size={24} />}
                color="secondary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Insights e Análises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Análise de Performance</h4>
                <p className="text-blue-800">
                  {currentStatType === 'total' && 
                    `Seu inventário possui ${stats?.totalVehicles || 0} veículos no total. 
                     ${Math.round((stats?.availableVehicles || 0) / (stats?.totalVehicles || 1) * 100)}% estão disponíveis para venda.`
                  }
                  {currentStatType === 'available' && 
                    `Você tem ${stats?.availableVehicles || 0} veículos disponíveis para venda. 
                     Isso representa ${Math.round((stats?.availableVehicles || 0) / (stats?.totalVehicles || 1) * 100)}% do seu inventário total.`
                  }
                  {currentStatType === 'reserved' && 
                    `Atualmente ${stats?.reservedVehicles || 0} veículos estão reservados. 
                     Taxa de reserva: ${Math.round((stats?.reservedVehicles || 0) / (stats?.totalVehicles || 1) * 100)}% do inventário.`
                  }
                  {currentStatType === 'sold' && 
                    `Você vendeu ${stats?.soldVehicles || 0} veículos. 
                     Taxa de conversão: ${Math.round((stats?.soldVehicles || 0) / (stats?.totalVehicles || 1) * 100)}% do inventário.`
                  }
                  {currentStatType === 'average' && 
                    `O preço médio dos veículos é ${formatCurrency(stats?.averagePrice || 0)}. 
                     Esta é uma métrica importante para posicionamento de mercado.`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <ProtectedRoute>
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
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-zinc-800">
                      {currentStatType ? statTypeLabels[currentStatType] : "Estatísticas de Veículos"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {currentStatType ? statDescriptions[currentStatType] : "Análise detalhada do inventário"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {statsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-gray-500">Carregando estatísticas...</div>
            </div>
          ) : (
            renderDetailedAnalysis()
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusChart, SalesChart } from "@/components/Charts";
import { StatsCard } from "@/components/StatsCard";
import { formatCurrency } from "@/lib/utils";
import { 
  BarChart3, 
  TrendingUp, 
  Car, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  Target
} from "lucide-react";

interface StatsData {
  totalVehicles: number;
  soldVehicles: number;
  reservedVehicles: number;
  availableVehicles: number;
  averagePrice: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface SalesData {
  month: string;
  sales: number;
}

// CKDEV-NOTE: Analytics dashboard with stats cards, charts, and real-time data
// CKDEV-TODO: Add date range picker for filtered analytics
export default function Analytics() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
  });

  const { data: statusData, isLoading: isLoadingStatus } = useQuery<StatusData[]>({
    queryKey: ["/api/stats/vehicles-by-status"],
  });

  const { data: salesData, isLoading: isLoadingSales } = useQuery<SalesData[]>({
    queryKey: ["/api/stats/sales"],
  });

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  if (isLoadingStats || isLoadingStatus || isLoadingSales) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de análise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-zinc-800">Análises</h1>
              <p className="text-sm text-muted-foreground">Análise detalhada do desempenho e métricas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
        {/* CKDEV-NOTE: Key metrics cards with clickable navigation to detailed views */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <StatsCard
                title="Total de Veículos"
                value={stats?.totalVehicles || 0}
                icon={<Car size={24} />}
                color="primary"
                href="/vehicles"
              />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <StatsCard
                title="Vendas do Mês"
                value={stats?.soldVehicles || 0}
                icon={<TrendingUp size={24} />}
                color="success"
                href="/vehicles/by-status?status=sold&month=current"
              />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <StatsCard
                title="Reservados"
                value={stats?.reservedVehicles || 0}
                icon={<Clock size={24} />}
                color="warning"
                href="/vehicles/by-status?status=reserved"
              />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <StatsCard
                title="Preço Médio"
                value={stats?.averagePrice ? formatCurrency(stats.averagePrice) : "R$ 0"}
                icon={<DollarSign size={24} />}
                color="secondary"
                href="/statistics?type=average"
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Chart */}
          <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-zinc-800">
                <Target className="w-5 h-5 text-primary" />
                <span>Status dos Veículos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStatus ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <StatusChart data={statusData ?? []} />
              )}
            </CardContent>
          </Card>

          {/* Sales Chart */}
          <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-zinc-800">
                <Calendar className="w-5 h-5 text-green-600" />
                <span>Vendas por Mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSales ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <SalesChart data={salesData ?? []} />
              )}
            </CardContent>
          </Card>
        </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Indicators */}
            <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Indicadores</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {stats?.totalVehicles && stats?.soldVehicles ? Math.round((stats.soldVehicles / stats.totalVehicles) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Disponibilidade</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {stats?.totalVehicles && stats?.availableVehicles ? Math.round((stats.availableVehicles / stats.totalVehicles) * 100) : 0}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reservas Pendentes</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {stats?.totalVehicles && stats?.reservedVehicles ? Math.round((stats.reservedVehicles / stats.totalVehicles) * 100) : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* CKDEV-NOTE: Top brands section uses hardcoded data for demonstration */}
            {/* CKDEV-TODO: Replace with real brand statistics from API */}
            <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <Car className="w-5 h-5 text-purple-600" />
                  <span>Marcas Populares</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Toyota</span>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">35%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Honda</span>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">28%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ford</span>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">22%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Chevrolet</span>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">15%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-white shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-zinc-800">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span>Atividades Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800">Veículo vendido</p>
                    <p className="text-xs text-muted-foreground">Honda Civic 2020</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800">Novo veículo adicionado</p>
                    <p className="text-xs text-muted-foreground">Toyota Corolla 2023</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800">Reserva criada</p>
                    <p className="text-xs text-muted-foreground">Ford Focus 2021</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
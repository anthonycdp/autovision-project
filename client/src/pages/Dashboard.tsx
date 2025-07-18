import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleModal } from "@/components/VehicleModal";
import { StatsCard } from "@/components/StatsCard";
import { StatusChart, SalesChart } from "@/components/Charts";
import { Pagination } from "@/components/Pagination";
import { BrandDropdown } from "@/components/BrandDropdown";
import { 
  Car, 
  Plus, 
  CheckCircle, 
  Handshake, 
  DollarSign
} from "lucide-react";
import type { Vehicle, VehicleFilters, InsertVehicle } from "@shared/schema";

const ITEMS_PER_PAGE = 10;

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

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: ITEMS_PER_PAGE,
    make: "",
    status: "",
    minYear: "",
    search: "",
  });

  const isAdmin = user?.type === "admin";

  // Fetch data
  const { data: stats, isLoading: isLoadingStats } = useQuery<StatsData>({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  const { data: statusData, isLoading: isLoadingStatus } = useQuery<StatusData[]>({
    queryKey: ["/api/stats/vehicles-by-status"],
    enabled: !!user,
  });

  const { data: salesData, isLoading: isLoadingSales } = useQuery<SalesData[]>({
    queryKey: ["/api/stats/sales"],
    enabled: !!user,
  });

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["/api/vehicles", filters],
    queryFn: () => api.getVehicles(filters),
    enabled: !!user,
  });

  // Mutations
  const createVehicleMutation = useMutation({
    mutationFn: (data: InsertVehicle) => api.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/vehicles-by-status"] });
      toast({
        title: "Sucesso!",
        description: "Veículo criado com sucesso.",
      });
      closeModal();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar veículo.",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertVehicle> }) =>
      api.updateVehicle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/vehicles-by-status"] });
      toast({
        title: "Sucesso!",
        description: "Veículo atualizado com sucesso.",
      });
      closeModal();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar veículo.",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => api.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/vehicles-by-status"] });
      toast({
        title: "Sucesso!",
        description: "Veículo excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir veículo.",
        variant: "destructive",
      });
    },
  });

  const uploadImagesMutation = useMutation({
    mutationFn: ({ vehicleId, files }: { vehicleId: string; files: File[] }) =>
      api.uploadVehicleImages(vehicleId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso!",
        description: "Imagens carregadas com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar imagens.",
        variant: "destructive",
      });
    },
  });

  const totalPages = Math.ceil((vehiclesData?.total || 0) / filters.limit);

  const handleVehicleSubmit = async (data: InsertVehicle) => {
    if (selectedVehicle) {
      await updateVehicleMutation.mutateAsync({
        id: selectedVehicle.id,
        data,
      });
    } else {
      await createVehicleMutation.mutateAsync(data);
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este veículo?")) {
      await deleteVehicleMutation.mutateAsync(id);
    }
  };

  const handleFilterChange = (key: keyof VehicleFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusClick = (status: string) => {
    setLocation(`/vehicles/by-status?status=${status}`);
  };

  const handleSalesClick = (month: string) => {
    setLocation(`/analytics?month=${month}`);
  };

  const closeModal = () => {
    setSelectedVehicle(null);
    setIsVehicleModalOpen(false);
  };

  const handleUploadImages = async (vehicleId: string, files: File[]) => {
    await uploadImagesMutation.mutateAsync({ vehicleId, files });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-muted sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                  <Car size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-800">Painel</h1>
                  <p className="text-sm text-muted-foreground">Visão geral e gerenciamento do sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Button
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Veículo
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Side - Vehicle Management */}
          <div className="w-full xl:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {/* Vehicle Management Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Veículos</h2>
                    <p className="text-sm text-gray-600 mt-1">Gerencie o inventário da concessionária</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {isAdmin && (
                      <>
                        <Button
                          onClick={() => setIsVehicleModalOpen(true)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg rounded-lg"
                        >
                          <Plus size={16} className="mr-2" />
                          Adicionar Veículo
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Enhanced Filters */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <BrandDropdown
                      value={filters.make || ""}
                      onValueChange={(value) => handleFilterChange("make", value)}
                      className="bg-white"
                      includeAllOption={true}
                      showIcon={true}
                    />

                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) => handleFilterChange("status", value === "all" ? "" : value)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="reserved">Reservado</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="number"
                      placeholder="Ano mínimo"
                      value={filters.minYear || ""}
                      onChange={(e) => handleFilterChange("minYear", parseInt(e.target.value) || "")}
                      className="bg-white"
                    />

                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={filters.search || ""}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle List */}
              <div className="p-6">
                {isLoadingVehicles ? (
                  <div className="space-y-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                          <div className="lg:w-40 h-32 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {vehiclesData?.vehicles?.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
                          <Car size={48} className="text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          Nenhum veículo encontrado
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                          Não há veículos cadastrados ou que correspondam aos filtros aplicados. 
                          {isAdmin ? ' Adicione o primeiro veículo para começar.' : ' Entre em contato com o administrador.'}
                        </p>
                        {isAdmin && (
                          <Button
                            onClick={() => setIsVehicleModalOpen(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg rounded-lg px-8 py-3"
                          >
                            <Plus size={20} className="mr-2" />
                            Adicionar Primeiro Veículo
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6 animate-fade-in">
                        {vehiclesData?.vehicles?.map((vehicle, index) => (
                          <div key={vehicle.id} style={{ animationDelay: `${index * 0.1}s` }} className="animate-fade-in">
                            <VehicleCard
                              vehicle={vehicle}
                              onEdit={handleEditVehicle}
                              onDelete={handleDeleteVehicle}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {vehiclesData && vehiclesData.total > 0 && (
                      <Pagination
                        currentPage={filters.page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={vehiclesData.total}
                        itemsPerPage={filters.limit}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Statistics and Charts */}
          <div className="w-full xl:w-1/3 space-y-6">
            {/* Enhanced Stats Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Estatísticas</h3>
                  <p className="text-xs text-gray-500 mt-1">Clique em uma estatística para ver detalhes</p>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                <StatsCard
                  title="Total de Veículos"
                  value={stats?.totalVehicles ?? 0}
                  icon={<Car size={24} />}
                  color="primary"
                  href="/statistics?type=total"
                />
                <div className="border-t border-gray-100 pt-4">
                  <StatsCard
                    title="Disponíveis"
                    value={stats?.availableVehicles ?? 0}
                    icon={<CheckCircle size={24} />}
                    color="success"
                    href="/vehicles/by-status?status=available"
                  />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <StatsCard
                    title="Reservados"
                    value={stats?.reservedVehicles ?? 0}
                    icon={<Handshake size={24} />}
                    color="warning"
                    href="/vehicles/by-status?status=reserved"
                  />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <StatsCard
                    title="Preço Médio"
                    value={stats?.averagePrice ? formatCurrency(stats.averagePrice) : "R$ 0"}
                    icon={<DollarSign size={24} />}
                    color="secondary"
                    href="/statistics?type=average"
                  />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Veículos por Status</h3>
                  <p className="text-xs text-gray-500 mt-1">Clique em um status para ver veículos</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="h-64 cursor-pointer">
                {statusData ? (
                  <StatusChart data={statusData} onStatusClick={handleStatusClick} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="animate-pulse">Carregando gráfico...</div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Vendas por Mês</h3>
                  <p className="text-xs text-gray-500 mt-1">Clique em um mês para ver análises</p>
                </div>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
              <div className="h-64 cursor-pointer">
                {salesData ? (
                  <SalesChart data={salesData} onMonthClick={handleSalesClick} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="animate-pulse">Carregando gráfico...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Modal */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={closeModal}
        onSubmit={handleVehicleSubmit}
        vehicle={selectedVehicle}
        onUploadImages={handleUploadImages}
      />
    </div>
  );
}
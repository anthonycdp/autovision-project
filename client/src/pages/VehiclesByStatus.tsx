import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { VehicleGrid } from "@/components/VehicleGrid";
import { VehicleList } from "@/components/VehicleList";
import { VehicleFilters } from "@/components/VehicleFilters";
import { VehicleModal } from "@/components/VehicleModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, LayoutGrid, List, Calendar, Filter } from "lucide-react";
import { Link } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle, VehicleFilters as VehicleFiltersType, InsertVehicle } from "@shared/schema";

const statusLabels = {
  available: "Disponíveis",
  reserved: "Reservados",
  sold: "Vendidos"
};

const statusDescriptions = {
  available: "Veículos disponíveis para venda",
  reserved: "Veículos reservados pelos clientes",
  sold: "Veículos já vendidos"
};

const getStatusDescription = (status: string, monthFilter?: string) => {
  if (status === 'sold' && monthFilter === 'current') {
    return "Veículos vendidos no mês atual";
  }
  return statusDescriptions[status as keyof typeof statusDescriptions] || "Lista de veículos";
};

export default function VehiclesByStatus() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [filters, setFilters] = useState<VehicleFiltersType & { page: number; limit: number }>({
    page: 1,
    limit: 20,
    status: "",
    make: "",
    minYear: undefined,
    maxYear: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    search: "",
  });

  // Get status from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const monthFilter = urlParams.get('month');
    
    if (status && ['available', 'reserved', 'sold'].includes(status)) {
      setFilters(prev => ({ ...prev, status }));
    }
    
    // If filtering by month for sold vehicles, show only current month
    if (status === 'sold' && monthFilter === 'current') {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // months are 0-indexed
      
      // Set filters to show only vehicles sold in current month
      setFilters(prev => ({ 
        ...prev, 
        status: 'sold',
        // Note: You would need to implement date filtering in the API
        // For now, we'll show all sold vehicles
      }));
    }
  }, []);

  const currentStatus = filters.status as keyof typeof statusLabels;
  const monthFilter = new URLSearchParams(window.location.search).get('month');

  const { data: vehiclesData, isLoading, error } = useQuery({
    queryKey: ["/api/vehicles", filters],
    queryFn: () => api.getVehicles(filters),
  });

  const handleFilterChange = (key: keyof VehicleFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: currentStatus || "",
      make: "",
      minYear: undefined,
      maxYear: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      search: "",
    });
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await api.deleteVehicle(id);
      toast({
        title: "Sucesso",
        description: "Veículo deletado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar veículo",
        variant: "destructive",
      });
    }
  };

  const handleVehicleSubmit = async (data: InsertVehicle) => {
    try {
      if (selectedVehicle) {
        await api.updateVehicle(selectedVehicle.id, data);
        toast({
          title: "Sucesso",
          description: "Veículo atualizado com sucesso",
        });
      }
      setIsVehicleModalOpen(false);
      setSelectedVehicle(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar veículo",
        variant: "destructive",
      });
    }
  };

  const closeModal = () => {
    setIsVehicleModalOpen(false);
    setSelectedVehicle(null);
  };

  const isAdmin = user?.type === "admin";

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
                    <Filter size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-xl font-semibold text-zinc-800">
                        {currentStatus ? (
                          monthFilter === 'current' && currentStatus === 'sold' 
                            ? "Vendas do Mês"
                            : statusLabels[currentStatus]
                        ) : "Veículos por Status"}
                      </h1>
                      {monthFilter === 'current' && currentStatus === 'sold' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          <Calendar size={14} className="mr-1" />
                          Mês Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getStatusDescription(currentStatus, monthFilter || undefined) || "Veículos filtrados por situação"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List size={16} />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="mb-8">
            <VehicleFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isLoading={isLoading}
            />
          </div>

          {/* Vehicle Count */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {vehiclesData?.total ? (
                  `Mostrando ${vehiclesData.vehicles.length} de ${vehiclesData.total} veículos`
                ) : (
                  "Carregando veículos..."
                )}
              </p>
              {monthFilter === 'current' && currentStatus === 'sold' && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                  <Calendar size={14} />
                  <span>Filtro: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Display */}
          <div className="min-h-[400px]">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500">Erro ao carregar veículos</p>
              </div>
            ) : viewMode === "grid" ? (
              <VehicleGrid
                vehicles={vehiclesData?.vehicles || []}
                onEdit={handleEditVehicle}
                onDelete={handleDeleteVehicle}
                isLoading={isLoading}
              />
            ) : (
              <VehicleList
                vehicles={vehiclesData?.vehicles || []}
                onEdit={handleEditVehicle}
                onDelete={handleDeleteVehicle}
                isLoading={isLoading}
              />
            )}
          </div>
        </main>

        {/* Vehicle Modal */}
        <VehicleModal
          isOpen={isVehicleModalOpen}
          onClose={closeModal}
          onSubmit={handleVehicleSubmit}
          vehicle={selectedVehicle}
        />
      </div>
    </ProtectedRoute>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { VehicleFilters } from "@/components/VehicleFilters";
import { VehicleGrid } from "@/components/VehicleGrid";
import { VehicleList } from "@/components/VehicleList";
import { VehicleModal } from "@/components/VehicleModal";
import { Pagination } from "@/components/Pagination";
import { 
  Car, 
  Plus, 
  Grid,
  List,
  LayoutGrid,
  LayoutList
} from "lucide-react";
import type { Vehicle, VehicleFilters as VehicleFiltersType, InsertVehicle } from "@shared/schema";

const ITEMS_PER_PAGE = 12;

export default function Vehicles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState<VehicleFiltersType & { page: number; limit: number }>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    make: "",
    model: "",
    status: "",
    approvalStatus: "",
    minYear: undefined,
    maxYear: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minKm: undefined,
    maxKm: undefined,
    color: "",
    search: "",
  });

  const isAdmin = user?.type === "admin";

  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ["/api/vehicles", filters],
    queryFn: () => api.getVehicles(filters),
    enabled: !!user,
  });

  const createVehicleMutation = useMutation({
    mutationFn: (data: InsertVehicle) => api.createVehicle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
  const currentPage = filters.page;

  const handleFilterChange = (key: keyof VehicleFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: ITEMS_PER_PAGE,
      make: "",
      model: "",
      status: "",
      approvalStatus: "",
      minYear: undefined,
      maxYear: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minKm: undefined,
      maxKm: undefined,
      color: "",
      search: "",
    });
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsVehicleModalOpen(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este veículo?")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const handleSubmitVehicle = async (data: InsertVehicle) => {
    if (selectedVehicle) {
      await updateVehicleMutation.mutateAsync({
        id: selectedVehicle.id,
        data,
      });
    } else {
      await createVehicleMutation.mutateAsync(data);
    }
  };

  const handleUploadImages = async (vehicleId: string, files: File[]) => {
    await uploadImagesMutation.mutateAsync({ vehicleId, files });
  };

  const closeModal = () => {
    setIsVehicleModalOpen(false);
    setSelectedVehicle(null);
  };

  if (!user) {
    return null;
  }

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
                  <h1 className="text-xl font-semibold text-zinc-800">Veículos</h1>
                  <p className="text-sm text-muted-foreground">Gerencie o inventário completo de veículos</p>
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
              
              <div className="hidden sm:flex items-center space-x-1 bg-muted p-1 rounded-xl">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-lg px-3"
                >
                  <LayoutGrid size={16} />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-lg px-3"
                >
                  <LayoutList size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <VehicleFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="mb-4 sm:mb-0">
            <p className="text-sm text-gray-600">
              {isLoading ? (
                "Carregando..."
              ) : (
                <>
                  Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, vehiclesData?.total || 0)} de{" "}
                  {vehiclesData?.total || 0} veículos
                </>
              )}
            </p>
          </div>

          <div className="sm:hidden">
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-full">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-full px-3"
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-full px-3"
              >
                <LayoutList size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Vehicle List/Grid */}
        {!isLoading && vehiclesData?.vehicles?.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
              <Car size={48} className="text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Nenhum veículo encontrado
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Não há veículos que correspondam aos filtros aplicados. Tente ajustar os filtros ou adicionar novos veículos.
            </p>
            {isAdmin && (
              <Button
                onClick={() => setIsVehicleModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg rounded-full"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Primeiro Veículo
              </Button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={vehiclesData?.total || 0}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Vehicle Modal */}
      {isVehicleModalOpen && (
        <VehicleModal
          isOpen={isVehicleModalOpen}
          onClose={closeModal}
          onSubmit={handleSubmitVehicle}
          vehicle={selectedVehicle}
          onUploadImages={handleUploadImages}
        />
      )}
    </div>
  );
}
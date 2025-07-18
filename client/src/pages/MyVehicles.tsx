import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VehicleList } from "@/components/VehicleList";
import { VehicleGrid } from "@/components/VehicleGrid";
import { VehicleModal } from "@/components/VehicleModal";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Vehicle, InsertVehicle, VehicleFilters } from "@shared/schema";
import { 
  Plus, 
  Grid, 
  List, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Car,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

export default function MyVehicles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedTab, setSelectedTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Fetch user's vehicles with approval status filter
  const filters: VehicleFilters = {
    page: 1,
    limit: 100,
    approvalStatus: selectedTab === "all" ? undefined : selectedTab,
  };

  const { data: vehiclesData, isLoading } = useQuery<{ vehicles: Vehicle[]; total: number }>({
    queryKey: ["/api/vehicles", filters],
    enabled: !!user,
  });

  // Filter vehicles to show only those created by the current user
  const myVehicles = vehiclesData?.vehicles.filter(vehicle => vehicle.createdBy === user?.id) || [];

  const statusCounts = {
    all: myVehicles.length,
    pending: myVehicles.filter(v => v.approvalStatus === "pending").length,
    approved: myVehicles.filter(v => v.approvalStatus === "approved").length,
    rejected: myVehicles.filter(v => v.approvalStatus === "rejected").length,
  };

  const createVehicleMutation = useMutation({
    mutationFn: (data: InsertVehicle) => apiRequest("POST", "/api/vehicles", data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsModalOpen(false);
      setEditingVehicle(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar veículo",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertVehicle }) =>
      apiRequest("PUT", `/api/vehicles/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsModalOpen(false);
      setEditingVehicle(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar veículo",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/vehicles/${id}`),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo excluído com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir veículo",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setEditingVehicle(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este veículo?")) {
      deleteVehicleMutation.mutate(id);
    }
  };

  const handleSubmit = async (data: InsertVehicle) => {
    if (editingVehicle) {
      await updateVehicleMutation.mutateAsync({
        id: editingVehicle.id,
        data,
      });
    } else {
      await createVehicleMutation.mutateAsync(data);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const getTabColor = (tab: string) => {
    switch (tab) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
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
                  <Car size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-800">Meus Veículos</h1>
                  <p className="text-sm text-muted-foreground">Gerencie seus veículos e solicitações de aprovação</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 rounded-xl">
                {statusCounts.all} veículos
              </Badge>
              <Button 
                onClick={handleCreate}
                className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Veículo
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "all", label: "Todos" },
            { key: "pending", label: "Pendentes" },
            { key: "approved", label: "Aprovados" },
            { key: "rejected", label: "Rejeitados" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border border-muted shadow-sm text-sm font-medium transition-all ${
                selectedTab === tab.key
                  ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 hover:shadow-md"
              }`}
            >
              {getTabIcon(tab.key)}
              <span>{tab.label}</span>
              <Badge variant="outline" className="ml-1 text-xs">
                {statusCounts[tab.key as keyof typeof statusCounts]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Info Cards */}
        {selectedTab === "pending" && statusCounts.pending > 0 && (
          <Card className="mb-6 border border-yellow-200 bg-yellow-50/50 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Veículos Aguardando Aprovação</p>
                  <p className="text-yellow-700 text-sm">
                    Seus veículos estão sendo revisados pela equipe de administração.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === "rejected" && statusCounts.rejected > 0 && (
          <Card className="mb-6 border border-red-200 bg-red-50/50 rounded-xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-800 font-medium">Veículos Rejeitados</p>
                  <p className="text-red-700 text-sm">
                    Você pode solicitar nova aprovação após fazer as correções necessárias.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex gap-1 border border-muted rounded-md overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                viewMode === "grid"
                  ? "bg-zinc-100 text-zinc-800 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <Grid className="w-4 h-4" />
              Grade
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${
                viewMode === "list"
                  ? "bg-zinc-100 text-zinc-800 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <List className="w-4 h-4" />
              Lista
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {myVehicles.length} veículo(s) encontrado(s)
          </p>
        </div>

        {/* Vehicle Display */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando veículos...</p>
            </div>
          </div>
        ) : myVehicles.length === 0 ? (
          <div className="flex justify-center">
            <Card className="rounded-2xl bg-white py-12 shadow-md border-0 max-w-md w-full">
              <CardContent className="text-center">
                <Car className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
                <h3 className="text-lg font-semibold text-zinc-600 mb-2">
                  Nenhum veículo encontrado
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {selectedTab === "all" 
                    ? "Você ainda não cadastrou nenhum veículo."
                    : `Você não possui veículos ${selectedTab === "pending" ? "pendentes" : selectedTab === "approved" ? "aprovados" : "rejeitados"}.`
                  }
                </p>
                <Button 
                  onClick={handleCreate} 
                  className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Primeiro Veículo
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : viewMode === "grid" ? (
          <VehicleGrid
            vehicles={myVehicles}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        ) : (
          <VehicleList
            vehicles={myVehicles}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        )}

        {/* Vehicle Modal */}
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingVehicle(null);
          }}
          onSubmit={handleSubmit}
          vehicle={editingVehicle}
        />
      </div>
    </div>
  );
}
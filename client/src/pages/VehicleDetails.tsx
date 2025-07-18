import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Vehicle } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Car, Gauge, MapPin, DollarSign, Palette, RefreshCw, Sparkles, Edit, Trash2, Fuel, Settings, CreditCard, Shield, CheckCircle } from "lucide-react";
import { ImageGallery } from "@/components/ImageGallery";
import { Link } from "wouter";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VehicleModal } from "@/components/VehicleModal";
import { useState, useEffect } from "react";

export default function VehicleDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Debug: Check user type
  console.log("Current user:", user, "User type:", user?.type);
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDescription, setCurrentDescription] = useState<string | null>(null);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ["/api/vehicles", id],
    queryFn: () => api.getVehicle(id!),
    enabled: !!id,
  });

  // Sincronizar descrição local com dados do veículo
  useEffect(() => {
    if (vehicle) {
      setCurrentDescription(vehicle.description || null);
    }
  }, [vehicle]);

  const generateDescriptionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/vehicles/${id}/generate-description`),
    onSuccess: (data) => {
      // Atualizar estado local imediatamente para UI responsiva
      if (data.description) {
        setCurrentDescription(data.description);
      }
      
      toast({
        title: "Descrição gerada",
        description: data.fallbackUsed ? 
          "Descrição gerada usando modo offline (sem IA)" : 
          "Nova descrição foi gerada com IA com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", id] });
    },
    onError: (error: Error) => {
      console.error("Generate description error:", error);
      
      // Parse error message to provide better user feedback
      let errorMessage = "Erro ao gerar descrição";
      
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message.split(": ")[1]);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If parsing fails, use the original error message
          if (error.message.includes("404")) {
            errorMessage = "Veículo não encontrado";
          } else if (error.message.includes("401")) {
            errorMessage = "Acesso não autorizado";
          } else if (error.message.includes("403")) {
            errorMessage = "Permissão negada - apenas administradores podem gerar descrições";
          } else if (error.message.includes("500")) {
            errorMessage = "Erro interno do servidor - tente novamente";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Timeout - tente novamente em alguns segundos";
          } else if (error.message.includes("network")) {
            errorMessage = "Erro de conexão - verifique sua internet";
          }
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: (data: any) => api.updateVehicle(id!, data),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles", id] });
      setIsEditModalOpen(false);
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
    mutationFn: () => api.deleteVehicle(id!),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo deletado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      // Redirect to dashboard after deletion
      window.location.href = "/dashboard";
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao deletar veículo",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(parseFloat(price));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "sold":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-zinc-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível";
      case "reserved":
        return "Reservado";
      case "sold":
        return "Vendido";
      default:
        return "Desconhecido";
    }
  };

  const getApprovalStatusColor = (approvalStatus: string) => {
    switch (approvalStatus) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-zinc-800";
    }
  };

  const getApprovalStatusText = (approvalStatus: string) => {
    switch (approvalStatus) {
      case "approved":
        return "Aprovado";
      case "pending":
        return "Pendente";
      case "rejected":
        return "Rejeitado";
      default:
        return "Desconhecido";
    }
  };

  const getTransmissionText = (transmissionType: string) => {
    switch (transmissionType) {
      case "manual":
        return "Manual";
      case "automatic":
        return "Automático";
      case "cvt":
        return "CVT";
      case "semi_automatic":
        return "Semi-automático";
      default:
        return "Não informado";
    }
  };

  const getFuelText = (fuelType: string) => {
    switch (fuelType) {
      case "gasoline":
        return "Gasolina";
      case "ethanol":
        return "Etanol";
      case "flex":
        return "Flex";
      case "diesel":
        return "Diesel";
      case "electric":
        return "Elétrico";
      case "hybrid":
        return "Híbrido";
      default:
        return "Não informado";
    }
  };

  const handleDeleteVehicle = () => {
    if (window.confirm("Tem certeza que deseja deletar este veículo? Esta ação não pode ser desfeita.")) {
      deleteVehicleMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando detalhes do veículo...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !vehicle) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white flex items-center justify-center">
          <div className="text-center">
            <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-zinc-800 mb-2">
              Veículo não encontrado
            </h2>
            <p className="text-muted-foreground mb-4">
              O veículo que você está procurando não foi encontrado.
            </p>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
                    <Car size={24} />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-zinc-800">
                      {vehicle.make} {vehicle.model}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.fabricateYear} • {vehicle.color} • {vehicle.km.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className={`${getStatusColor(vehicle.status)} px-3 py-1 text-sm font-medium`}>
                  {getStatusText(vehicle.status)}
                </Badge>
                <div className="text-right">
                  <p className="text-2xl font-bold text-zinc-800">{formatPrice(vehicle.price)}</p>
                </div>
                {user?.type === "admin" && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-xl"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateDescriptionMutation.mutate()}
                      disabled={generateDescriptionMutation.isPending}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-xl"
                    >
                      {generateDescriptionMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Gerar Descrição com IA
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteVehicle}
                      disabled={deleteVehicleMutation.isPending}
                      className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded-xl"
                    >
                      {deleteVehicleMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Deletando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
              {/* Vehicle Image Gallery */}
              <div className="xl:col-span-3">
                <ImageGallery 
                  images={vehicle.imageURLs || []} 
                  vehicleName={`${vehicle.make} ${vehicle.model}`}
                />
                
                {/* Description */}
                <Card className="shadow-lg border-0 rounded-3xl mt-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-zinc-800">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-xl p-4">
                      {currentDescription ? (
                        <p className="text-zinc-700 leading-relaxed">{currentDescription}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Nenhuma descrição disponível para este veículo.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vehicle Details Sidebar */}
              <div className="xl:col-span-2 space-y-6">
                {/* Price Highlight */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-sm">
                  <div className="bg-blue-500 p-3 rounded-xl shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Preço</p>
                    <p className="font-bold text-2xl text-blue-900">{formatPrice(vehicle.price)}</p>
                  </div>
                </div>

                {/* Specifications */}
                <Card className="shadow-lg border-0 rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-zinc-800">Especificações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Car className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Marca e Modelo</p>
                          <p className="font-semibold text-zinc-800">{vehicle.make} {vehicle.model}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Ano de Fabricação</p>
                          <p className="font-semibold text-zinc-800">{vehicle.fabricateYear}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-purple-100 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Ano do Modelo</p>
                          <p className="font-semibold text-zinc-800">{vehicle.modelYear}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-orange-100 p-2 rounded-lg">
                          <Palette className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Cor</p>
                          <p className="font-semibold text-zinc-800">{vehicle.color}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <Gauge className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Quilometragem</p>
                          <p className="font-semibold text-zinc-800">
                            {vehicle.km.toLocaleString('pt-BR')} km
                          </p>
                        </div>
                      </div>


                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Settings className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Transmissão</p>
                          <p className="font-semibold text-zinc-800">{getTransmissionText(vehicle.transmissionType)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-amber-100 p-2 rounded-lg">
                          <Fuel className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Combustível</p>
                          <p className="font-semibold text-zinc-800">{getFuelText(vehicle.fuelType)}</p>
                        </div>
                      </div>

                      {vehicle.licensePlate && (
                        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                          <div className="bg-cyan-100 p-2 rounded-lg">
                            <CreditCard className="h-5 w-5 text-cyan-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Placa</p>
                            <p className="font-semibold text-zinc-800">{vehicle.licensePlate}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                        <div className="bg-teal-100 p-2 rounded-lg">
                          <Shield className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Status de Aprovação</p>
                          <Badge className={`${getApprovalStatusColor(vehicle.approvalStatus)} text-xs px-2 py-1`}>
                            {getApprovalStatusText(vehicle.approvalStatus)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Registration Details */}
                <Card className="shadow-lg border-0 rounded-3xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-zinc-800">Informações de Registro</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                      <div className="bg-muted p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data de Registro</p>
                        <p className="font-semibold text-zinc-800">{formatDate(vehicle.registrationDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                      <div className="bg-muted p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                        <p className="font-semibold text-zinc-800">{formatDate(vehicle.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                      <div className="bg-muted p-2 rounded-lg">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                        <p className="font-semibold text-zinc-800">{formatDate(vehicle.updatedAt)}</p>
                      </div>
                    </div>

                    {vehicle.approvedAt && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-700">Aprovado em</p>
                          <p className="font-semibold text-green-900">{formatDate(vehicle.approvedAt)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

      {/* Edit Vehicle Modal */}
      <VehicleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={async (data) => updateVehicleMutation.mutate(data)}
        vehicle={vehicle}
      />
    </ProtectedRoute>
  );
}
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Gauge, 
  Palette,
  Car,
  Heart,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Vehicle } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface VehicleListProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function VehicleList({ vehicles, onEdit, onDelete, isLoading = false }: VehicleListProps) {
  const { user } = useAuth();
  const isAdmin = user?.type === "admin";
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const requestApprovalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/vehicles/${id}/request-approval`),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Solicitação de aprovação enviada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao solicitar aprovação",
        variant: "destructive",
      });
    },
  });

  const statusLabels = {
    available: "Disponível",
    reserved: "Reservado", 
    sold: "Vendido",
  };

  const statusColors = {
    available: "bg-green-100 text-green-800 border-green-200",
    reserved: "bg-amber-100 text-amber-800 border-amber-200",
    sold: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const approvalStatusLabels = {
    approved: "Aprovado",
    pending: "Pendente",
    rejected: "Rejeitado",
  };

  const approvalStatusColors = {
    approved: "text-green-600",
    pending: "text-amber-600",
    rejected: "text-red-600",
  };

  const getFirstImageUrl = (vehicle: Vehicle) => {
    if (vehicle.imageURLs && Array.isArray(vehicle.imageURLs) && vehicle.imageURLs.length > 0) {
      return vehicle.imageURLs[0];
    }
    return `https://via.placeholder.com/120x90/e5e7eb/6b7280?text=${encodeURIComponent(vehicle.make)}`;
  };

  const toggleFavorite = (vehicleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(vehicleId)) {
      newFavorites.delete(vehicleId);
    } else {
      newFavorites.add(vehicleId);
    }
    setFavorites(newFavorites);
  };

  const handleEdit = (vehicle: Vehicle, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(vehicle);
  };

  const handleDelete = (vehicleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(vehicleId);
  };

  const handleRequestApproval = (vehicleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requestApprovalMutation.mutate(vehicleId);
  };

  const canRequestApproval = (vehicle: Vehicle) => {
    return (vehicle.createdBy === user?.id || isAdmin) && 
           (vehicle.approvalStatus === 'rejected' || vehicle.approvalStatus === 'pending');
  };

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-24 h-18 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {vehicles.map((vehicle) => (
        <Link key={vehicle.id} href={`/vehicle/${vehicle.id}`}>
          <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getFirstImageUrl(vehicle)}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-24 h-18 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => toggleFavorite(vehicle.id, e)}
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Heart 
                      className={`w-3 h-3 ${favorites.has(vehicle.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-gray-600 mt-1 truncate">
                        {vehicle.fabricateYear}/{vehicle.modelYear}
                      </p>
                      
                      {/* Vehicle Details */}
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{vehicle.fabricateYear || "N/A"}</span>
                        </div>
                        <div className="flex items-center">
                          <Gauge className="w-4 h-4 mr-1" />
                          <span>{vehicle.km ? `${vehicle.km.toLocaleString()} km` : "N/A"}</span>
                        </div>
                        <div className="flex items-center">
                          <Palette className="w-4 h-4 mr-1" />
                          <span>{vehicle.color || "N/A"}</span>
                        </div>
                        <div className="flex items-center">
                          <Car className="w-4 h-4 mr-1" />
                          <span>{vehicle.transmissionType || "N/A"}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge 
                          variant="secondary" 
                          className={`${statusColors[vehicle.status]} font-medium text-xs px-2 py-1 rounded-full border`}
                        >
                          {statusLabels[vehicle.status]}
                        </Badge>
                        {vehicle.approvalStatus && (
                          <div className={`flex items-center text-xs ${approvalStatusColors[vehicle.approvalStatus]}`}>
                            {getApprovalStatusIcon(vehicle.approvalStatus)}
                            <span className="ml-1">{approvalStatusLabels[vehicle.approvalStatus]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex flex-col lg:items-end space-y-3 mt-4 lg:mt-0">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(Number(vehicle.price))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="rounded-full border-gray-300 hover:border-blue-300 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalhes
                        </Button>

                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                className="rounded-full hover:bg-gray-100"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => handleEdit(vehicle, e)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {canRequestApproval(vehicle) && (
                                <DropdownMenuItem 
                                  onClick={(e) => handleRequestApproval(vehicle.id, e)}
                                  disabled={requestApprovalMutation.isPending}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <RefreshCw className={`w-4 h-4 mr-2 ${requestApprovalMutation.isPending ? 'animate-spin' : ''}`} />
                                  Solicitar Aprovação
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={(e) => handleDelete(vehicle.id, e)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
import { Vehicle } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, RefreshCw, Clock, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
}

// CKDEV-NOTE: VehicleCard displays vehicle info with role-based actions and approval workflow
export function VehicleCard({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  const { user } = useAuth();
  const isAdmin = user?.type === "admin"; // CKDEV-NOTE: Admin permissions for edit/delete actions
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // CKDEV-NOTE: Status mapping objects for consistent UI display across vehicle states
  const statusLabels = {
    available: "Disponível",
    reserved: "Reservado",
    sold: "Vendido",
  };

  const statusColors = {
    available: "bg-green-100 text-green-800",
    reserved: "bg-orange-100 text-orange-800",
    sold: "bg-gray-100 text-gray-800",
  };

  // CKDEV-NOTE: Approval workflow UI mappings for admin vehicle review process
  const approvalStatusLabels = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Rejeitado",
  };

  const approvalStatusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const getApprovalIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // CKDEV-NOTE: React Query mutation for vehicle approval requests with optimistic updates
  const requestApprovalMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/vehicles/${id}/request-approval`),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Solicitação de aprovação enviada com sucesso!",
      });
      // CKDEV-NOTE: Invalidate cache to refresh vehicle list with updated status
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

  // CKDEV-NOTE: Internationalization formatters for Brazilian Portuguese locale
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(price));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  // CKDEV-NOTE: Event handlers with propagation control to prevent card click conflicts
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // CKDEV-NOTE: Prevent card navigation when clicking action buttons
    onEdit(vehicle);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(vehicle.id);
  };

  const handleRequestApproval = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requestApprovalMutation.mutate(vehicle.id);
  };

  const canRequestApproval = (vehicle.createdBy === user?.id || isAdmin) && 
    (vehicle.approvalStatus === 'rejected' || vehicle.approvalStatus === 'pending');

  const isVehicleOwner = vehicle.createdBy === user?.id;

  // Get the first image URL from the array
  const getFirstImageUrl = () => {
    if (vehicle.imageURLs && Array.isArray(vehicle.imageURLs) && vehicle.imageURLs.length > 0) {
      return vehicle.imageURLs[0];
    }
    return null;
  };



  // Create a fallback image URL based on vehicle make
  const getFallbackImageUrl = () => {
    const makeSlug = vehicle.make.toLowerCase().replace(/\s+/g, '-');
    return `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(`${vehicle.make} ${vehicle.model}`)}`;
  };

  const imageUrl = getFirstImageUrl();

  return (
    <Link href={`/vehicle/${vehicle.id}`}>
      <div className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full lg:w-40 h-32 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.src = getFallbackImageUrl();
                }}
              />
            ) : (
              <div className="w-full lg:w-40 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-blue-600 mb-1">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-blue-600 text-xs font-medium">Sem imagem</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3 flex-1">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicle.fabricateYear}/{vehicle.modelYear} • {vehicle.color} • {formatNumber(vehicle.km)} km
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(vehicle.price)}
                  </p>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[vehicle.status]}`}>
                    {statusLabels[vehicle.status]}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge 
                    variant="outline" 
                    className={`${approvalStatusColors[vehicle.approvalStatus]} border-0 text-xs`}
                  >
                    <span className="mr-1">{getApprovalIcon(vehicle.approvalStatus)}</span>
                    {approvalStatusLabels[vehicle.approvalStatus]}
                  </Badge>
                  {canRequestApproval && (
                    <button
                      onClick={handleRequestApproval}
                      disabled={requestApprovalMutation.isPending}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                      title="Solicitar aprovação"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${requestApprovalMutation.isPending ? 'animate-spin' : ''}`} />
                      Solicitar
                    </button>
                  )}
                </div>
                {vehicle.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                    {vehicle.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-4">
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditClick}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

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
  MapPin,
  Car,
  Heart,
  Share2,
  MoreVertical
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { Vehicle } from "@shared/schema";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface VehicleGridProps {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function VehicleGrid({ vehicles, onEdit, onDelete, isLoading = false }: VehicleGridProps) {
  const { user } = useAuth();
  const isAdmin = user?.type === "admin";
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  const getFirstImageUrl = (vehicle: Vehicle) => {
    if (vehicle.imageURLs && Array.isArray(vehicle.imageURLs) && vehicle.imageURLs.length > 0) {
      return vehicle.imageURLs[0];
    }
    return `https://via.placeholder.com/400x300/e5e7eb/6b7280?text=${encodeURIComponent(vehicle.make + ' ' + vehicle.model)}`;
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-0 shadow-md">
            <div className="aspect-[4/3] bg-gray-200 animate-pulse"></div>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <Link key={vehicle.id} href={`/vehicle/${vehicle.id}`}>
          <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer bg-white rounded-2xl">
            {/* Image Section */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={getFirstImageUrl(vehicle)}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
                <div className="absolute top-3 right-3 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => toggleFavorite(vehicle.id, e)}
                    className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Heart 
                      className={`w-4 h-4 ${favorites.has(vehicle.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <Badge 
                  variant="secondary" 
                  className={`${statusColors[vehicle.status]} font-medium text-xs px-2 py-1 rounded-full border`}
                >
                  {statusLabels[vehicle.status]}
                </Badge>
              </div>

              {/* Price Badge */}
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-white/95 text-gray-900 font-bold text-sm px-3 py-1 rounded-full shadow-md">
                  {formatCurrency(Number(vehicle.price))}
                </Badge>
              </div>
            </div>

            {/* Content Section */}
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-blue-600 transition-colors duration-200">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicle.fabricateYear}/{vehicle.modelYear}
                  </p>
                </div>

                {/* Vehicle Details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{vehicle.fabricateYear || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Gauge className="w-3 h-3 mr-1" />
                    <span>{vehicle.km ? `${vehicle.km.toLocaleString()} km` : "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Palette className="w-3 h-3 mr-1" />
                    <span>{vehicle.color || "N/A"}</span>
                  </div>
                  <div className="flex items-center">
                    <Car className="w-3 h-3 mr-1" />
                    <span>{vehicle.transmissionType || "N/A"}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="h-8 px-3 text-xs rounded-full border-gray-300 hover:border-blue-300 hover:text-blue-600"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                  </div>

                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEdit(vehicle, e)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
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
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
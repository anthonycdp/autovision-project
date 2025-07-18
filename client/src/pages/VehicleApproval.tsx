import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Eye, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Vehicle } from "@shared/schema";
import { Link } from "wouter";

// CKDEV-NOTE: VehicleApproval page for admin review of pending vehicle submissions
// CKDEV-TODO: Add bulk approve/reject functionality for multiple vehicles
export default function VehicleApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingVehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles/pending"],
  });

  // CKDEV-NOTE: Approval mutations invalidate both pending and main vehicle queries
  // CKDEV-QUESTION: Should we add approval reason/comment field for better tracking?
  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/vehicles/${id}/approve`),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo aprovado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao aprovar veículo",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/vehicles/${id}/reject`),
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo rejeitado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao rejeitar veículo",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(price));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando veículos pendentes...</p>
        </div>
      </div>
    );
  }

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
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                  <Clock size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-800">Aprovação de Veículos</h1>
                  <p className="text-sm text-muted-foreground">Revise e aprove novos veículos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-orange-50/50 text-orange-600 border-orange-200 rounded-xl">
                <Clock className="w-4 h-4 mr-1" />
                {pendingVehicles?.length || 0} Pendentes
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!pendingVehicles || pendingVehicles.length === 0 ? (
          <div className="flex justify-center">
            <Card className="shadow-sm rounded-2xl border border-muted max-w-md w-full">
              <CardContent className="p-8 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
                <h3 className="text-lg font-semibold text-zinc-600 mb-2">
                  Nenhum veículo pendente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Todos os veículos foram aprovados ou rejeitados.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="border-l-4 border-l-orange-400 shadow-sm rounded-2xl border border-muted hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-zinc-800">
                      {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <Badge variant="outline" className="bg-orange-50/50 text-orange-600 border-orange-200 rounded-xl">
                      Pendente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-zinc-800">Ano:</strong> {vehicle.fabricateYear}/{vehicle.modelYear}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-zinc-800">Cor:</strong> {vehicle.color}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-zinc-800">Quilometragem:</strong> {formatNumber(vehicle.km)} km
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-zinc-800">Preço:</strong> <span className="text-lg font-semibold text-green-600">
                          {formatPrice(vehicle.price)}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-zinc-800">Registrado em:</strong> {new Date(vehicle.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {vehicle.description && (
                    <div className="mb-4">
                      <h4 className="font-medium text-zinc-800 mb-2">Descrição:</h4>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl">
                        {vehicle.description}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <Link href={`/vehicle/${vehicle.id}`}>
                      <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary/30 rounded-xl">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </Link>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectMutation.mutate(vehicle.id)}
                        disabled={rejectMutation.isPending}
                        className="hover:bg-red-700 rounded-xl"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(vehicle.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 rounded-xl"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
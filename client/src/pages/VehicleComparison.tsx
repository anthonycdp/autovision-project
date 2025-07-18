import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Car, DollarSign, Calendar, Gauge, GitCompare, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Vehicle } from "@shared/schema";
import { Link } from "wouter";

// CKDEV-NOTE: VehicleComparison component allows users to select and compare multiple vehicles
// CKDEV-TODO: Add vehicle comparison charts for visual price/spec analysis
export default function VehicleComparison() {
  const { toast } = useToast();
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<{
    vehicles: Vehicle[];
    comparisonSummary: string;
  } | null>(null);

  const { data: vehiclesData, isLoading } = useQuery<{ vehicles: Vehicle[] }>({
    queryKey: ["/api/vehicles"],
  });

  const compareMutation = useMutation({
    mutationFn: (vehicleIds: string[]) => apiRequest("POST", "/api/vehicles/compare", { vehicleIds }),
    onSuccess: (data) => {
      console.log("Comparison result:", data);
      if (data && data.vehicles && data.vehicles.length > 0) {
        setComparisonResult(data);
        toast({
          title: "Comparação realizada",
          description: `${data.vehicles.length} veículos comparados com sucesso!`,
        });
      } else {
        toast({
          title: "Aviso",
          description: "Nenhum dado de comparação foi retornado",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Comparison error:", error);
      toast({
        title: "Erro",
        description: "Erro ao comparar veículos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  // CKDEV-NOTE: handleCompare validates selection and calls API with loading feedback
  // CKDEV-QUESTION: Should we limit max vehicles for comparison to avoid UI overflow?
  const handleCompare = () => {
    if (selectedVehicles.length < 2) {
      toast({
        title: "Seleção insuficiente",
        description: "Selecione pelo menos 2 veículos para comparar",
        variant: "destructive",
      });
      return;
    }
    
    // Clear previous results
    setComparisonResult(null);
    
    // Show loading toast
    toast({
      title: "Comparando veículos...",
      description: "Aguarde enquanto processamos a comparação",
    });
    
    compareMutation.mutate(selectedVehicles);
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(price));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("pt-BR").format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "reserved":
        return "bg-orange-100 text-orange-800";
      case "sold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível";
      case "reserved":
        return "Reservado";
      case "sold":
        return "Vendido";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f9fbfc] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando veículos...</p>
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
                <div className="bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                  <GitCompare size={24} />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-zinc-800">Comparação de Veículos</h1>
                  <p className="text-sm text-muted-foreground">Compare especificações e preços</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 rounded-xl">
                {selectedVehicles.length} selecionados
              </Badge>
              <Button
                onClick={handleCompare}
                disabled={selectedVehicles.length < 2 || compareMutation.isPending}
                className="bg-primary text-white font-medium rounded-xl px-5 py-2 shadow-lg transition-all hover:bg-primary/90 active:scale-95"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                {compareMutation.isPending ? "Comparando..." : "Comparar"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CKDEV-NOTE: Comparison results section with highlighted styling and OpenAI summary */}
        {comparisonResult && comparisonResult.vehicles && comparisonResult.vehicles.length > 0 && (
          <Card className="mb-6 border border-primary/20 bg-primary/5 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-primary font-semibold">Resultado da Comparação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {comparisonResult.vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white p-4 rounded-xl border border-muted shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-zinc-800">{vehicle.make} {vehicle.model}</h3>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {getStatusLabel(vehicle.status)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                        {vehicle.fabricateYear}/{vehicle.modelYear}
                      </div>
                      <div className="flex items-center">
                        <Gauge className="w-4 h-4 mr-2 text-muted-foreground" />
                        {formatNumber(vehicle.km)} km
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                        {formatPrice(vehicle.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {comparisonResult.comparisonSummary && (
                <div className="bg-white p-4 rounded-xl border border-muted shadow-sm">
                  <h4 className="font-semibold mb-2 text-zinc-800">Análise Comparativa</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comparisonResult.comparisonSummary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiclesData?.vehicles?.map((vehicle) => (
            <Card key={vehicle.id} className={`cursor-pointer transition-all shadow-sm rounded-2xl border ${
              selectedVehicles.includes(vehicle.id) ? "ring-2 ring-primary/30 bg-primary/5 border-primary/30" : "hover:shadow-lg border-muted hover:border-primary/30"
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Checkbox
                    checked={selectedVehicles.includes(vehicle.id)}
                    onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                    className="rounded-md"
                  />
                  <Badge className={getStatusColor(vehicle.status)}>
                    {getStatusLabel(vehicle.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-zinc-800">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    {vehicle.fabricateYear}/{vehicle.modelYear} • {vehicle.color}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Gauge className="w-4 h-4 mr-2" />
                    {formatNumber(vehicle.km)} km
                  </div>
                  <div className="flex items-center text-lg font-bold text-green-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatPrice(vehicle.price)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
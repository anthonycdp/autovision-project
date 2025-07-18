import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Calendar,
  Car,
  DollarSign,
  Settings,
  RefreshCw
} from "lucide-react";
import type { VehicleFilters as VehicleFiltersType } from "@shared/schema";
import { BrandDropdown } from "@/components/BrandDropdown";

interface VehicleFiltersProps {
  filters: VehicleFiltersType;
  onFilterChange: (key: keyof VehicleFiltersType, value: any) => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

export function VehicleFilters({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  isLoading = false 
}: VehicleFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  // CKDEV-NOTE: Brands logic moved to BrandDropdown component

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== "" && value !== null && value !== undefined
  ).length - 2; // Exclude page and limit

  const handleClearFilters = () => {
    onClearFilters();
    setIsOpen(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Search Bar */}
        <div className="py-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar veículos..."
              value={filters.search || ""}
              onChange={(e) => onFilterChange("search", e.target.value)}
              className="pl-10 pr-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-full"
            >
              <Filter className="w-4 h-4" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-blue-600">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center justify-between py-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar veículos..."
                value={filters.search || ""}
                onChange={(e) => onFilterChange("search", e.target.value)}
                className="pl-10 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <BrandDropdown
              value={filters.make || ""}
              onValueChange={(value) => onFilterChange("make", value)}
              className="w-48 rounded-full"
              includeAllOption={true}
              showIcon={true}
            />

            <Select
              value={filters.status || "all"}
              onValueChange={(value) => onFilterChange("status", value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-48 rounded-full">
                <Settings className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="reserved">Reservado</SelectItem>
                <SelectItem value="sold">Vendido</SelectItem>
              </SelectContent>
            </Select>

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Mais Filtros
                  <ChevronDown className="w-4 h-4 ml-2" />
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs bg-blue-600">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-red-600 rounded-full"
              >
                <X className="w-4 h-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <Card className="mb-4 border-0 shadow-none bg-gray-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Ano Mínimo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2018"
                      value={filters.minYear || ""}
                      onChange={(e) => onFilterChange("minYear", parseInt(e.target.value) || "")}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Ano Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 2024"
                      value={filters.maxYear || ""}
                      onChange={(e) => onFilterChange("maxYear", parseInt(e.target.value) || "")}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Preço Mínimo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 30000"
                      value={filters.minPrice || ""}
                      onChange={(e) => onFilterChange("minPrice", parseFloat(e.target.value) || "")}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600 flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Preço Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 100000"
                      value={filters.maxPrice || ""}
                      onChange={(e) => onFilterChange("maxPrice", parseFloat(e.target.value) || "")}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      Modelo
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Civic, Corolla..."
                      value={filters.model || ""}
                      onChange={(e) => onFilterChange("model", e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      Cor
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: Prata, Branco..."
                      value={filters.color || ""}
                      onChange={(e) => onFilterChange("color", e.target.value)}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      KM Máximo
                    </label>
                    <Input
                      type="number"
                      placeholder="Ex: 50000"
                      value={filters.maxKm || ""}
                      onChange={(e) => onFilterChange("maxKm", parseInt(e.target.value) || "")}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-600">
                      Status de Aprovação
                    </label>
                    <Select
                      value={filters.approvalStatus || "all"}
                      onValueChange={(value) => onFilterChange("approvalStatus", value === "all" ? "" : value)}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="rejected">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="rounded-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Limpar Filtros
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
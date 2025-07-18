import React, { useState } from "react";
import { ChevronDown, Car, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMarcas } from "@/hooks/useMarcas";
import { cn } from "@/lib/utils";

interface BrandDropdownProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  includeAllOption?: boolean;
  showIcon?: boolean;
  variant?: "default" | "outline" | "ghost";
}

// CKDEV-NOTE: Componente dedicado para dropdown de marcas com sincronização completa
export function BrandDropdown({
  value = "",
  onValueChange,
  placeholder = "Selecione uma marca",
  className,
  disabled = false,
  includeAllOption = false,
  showIcon = true,
  variant = "outline",
}: BrandDropdownProps) {
  const [open, setOpen] = useState(false);
  const { brands, isLoading, error, retry } = useMarcas();
  
  // CKDEV-NOTE: BrandDropdown component handles brand selection with search

  const handleSelect = (selectedValue: string) => {
    // Se clicar na mesma opção, desmarca
    const newValue = selectedValue === value ? "" : selectedValue;
    onValueChange?.(newValue);
    setOpen(false);
  };

  const selectedBrand = brands.find(brand => brand.make === value);
  const displayValue = selectedBrand 
    ? `${selectedBrand.make} (${selectedBrand.count} veículos)`
    : value || (includeAllOption ? "Todas as Marcas" : placeholder);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          role="combobox"
          aria-expanded={open}
          aria-controls="brand-list"
          data-state={open ? "open" : "closed"}
          className={cn("w-full justify-between", className)}
          disabled={disabled || isLoading}
        >
          <div className="flex items-center">
            {showIcon && <Car className="w-4 h-4 mr-2" />}
            <span className="truncate">
              {isLoading ? "Carregando..." : displayValue}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar marca..." />
          <CommandList>
            <CommandEmpty>
              {error ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-red-600 mb-2">❌ {error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retry}
                    className="text-xs"
                  >
                    🔄 Tentar novamente
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Carregando marcas...</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 p-4 text-center">
                  Nenhuma marca encontrada
                </p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {includeAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => handleSelect("")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <Car className="w-4 h-4 mr-2" />
                    <span>Todas as Marcas</span>
                  </div>
                </CommandItem>
              )}
              {brands.map((brand) => (
                <CommandItem
                  key={brand.make}
                  value={brand.make}
                  onSelect={() => handleSelect(brand.make)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{brand.make}</span>
                    <span className="text-xs text-gray-500">
                      {brand.count} veículos
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface Brand {
  make: string;
  count: number;
}

export interface UseMarcasReturn {
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  retry: () => Promise<void>;
  // CKDEV-NOTE: Helper para buscar marcas como array simples
  marcasSimples: string[];
  // CKDEV-NOTE: Helper para buscar marcas com contagem formatada
  marcasComContagem: Array<{ value: string; label: string }>;
}

// CKDEV-NOTE: Custom hook to manage vehicle brands data from API
export function useMarcas(): UseMarcasReturn {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getVehicleBrands();
      // CKDEV-NOTE: Garantir que dados estão no formato correto
      const validBrands = data.filter(brand => 
        brand && 
        brand.make && 
        typeof brand.make === 'string' && 
        brand.make.trim() !== ''
      );
      setBrands(validBrands);
    } catch (err) {
      console.error("Error fetching brands:", err);
      setError("Erro ao carregar marcas");
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const retry = useCallback(async () => {
    await fetchBrands();
  }, [fetchBrands]);

  // CKDEV-NOTE: Array simples de marcas para uso em selects básicos
  const marcasSimples = brands.map(brand => brand.make);

  // CKDEV-NOTE: Array formatado para uso em combobox com contagem
  const marcasComContagem = brands.map(brand => ({
    value: brand.make,
    label: `${brand.make} (${brand.count} veículos)`
  }));

  return {
    brands,
    isLoading,
    error,
    refetch: fetchBrands,
    retry,
    marcasSimples,
    marcasComContagem,
  };
}
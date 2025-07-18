import React, { useState, useEffect } from "react";
import { Vehicle, InsertVehicle } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Upload, Trash2, Sparkles, Check, Edit, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMarcas } from "@/hooks/useMarcas";

const vehicleSchema = z.object({
  make: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  fabricateYear: z.number().min(1900, "Ano de fabricação inválido").max(new Date().getFullYear()),
  modelYear: z.number().min(1900, "Ano do modelo inválido").max(new Date().getFullYear()),
  color: z.string().min(1, "Cor é obrigatória"),
  km: z.number().min(0, "Quilometragem deve ser positiva"),
  price: z.string().min(1, "Preço é obrigatório"),
  transmissionType: z.enum(["manual", "automatic", "cvt", "semi_automatic"]),
  fuelType: z.enum(["gasoline", "ethanol", "flex", "diesel", "electric", "hybrid"]),
  licensePlate: z.string().optional(),
  status: z.enum(["available", "reserved", "sold"]),
  description: z.string().optional(),
});

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InsertVehicle) => Promise<void>;
  vehicle?: Vehicle | null;
  onUploadImages?: (vehicleId: string, files: File[]) => Promise<void>;
}

export function VehicleModal({ isOpen, onClose, onSubmit, vehicle, onUploadImages }: VehicleModalProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState<string>("");
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState<string>("");
  const [showDescriptionActions, setShowDescriptionActions] = useState(false);
  const { toast } = useToast();
  const { brands, isLoading: brandsLoading, marcasComContagem } = useMarcas();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<InsertVehicle>({
    resolver: zodResolver(vehicleSchema),
  });

  const statusValue = watch("status");
  const transmissionValue = watch("transmissionType");
  const fuelValue = watch("fuelType");
  const descriptionValue = watch("description");
  const makeValue = watch("make");

  // CKDEV-NOTE: Convert brands to combobox options with search functionality
  const brandOptions: ComboboxOption[] = React.useMemo(() => {
    // Usar o helper do hook para obter marcas formatadas
    const options = marcasComContagem.map(marca => ({
      label: marca.label,
      value: marca.value,
    }));
    
    // Se o valor atual não estiver na lista de marcas (marca customizada), adiciona ela
    if (makeValue && !brands.find(b => b.make === makeValue)) {
      options.unshift({
        label: makeValue,
        value: makeValue,
      });
    }
    
    return options;
  }, [marcasComContagem, makeValue, brands]);

  const handleBrandChange = (selectedBrand: string) => {
    setValue("make", selectedBrand, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
  };

  const handleCustomBrandCreate = (customBrand: string) => {
    // CKDEV-NOTE: Allow custom brand creation but normalize the input
    const normalizedBrand = customBrand.trim();
    if (normalizedBrand) {
      setValue("make", normalizedBrand, {
        shouldValidate: true,
        shouldTouch: true,
        shouldDirty: true,
      });
      toast({
        title: "Nova marca adicionada",
        description: `Marca "${normalizedBrand}" será criada ao salvar o veículo`,
      });
    }
  };

  useEffect(() => {
    if (vehicle) {
      reset({
        make: vehicle.make,
        model: vehicle.model,
        fabricateYear: vehicle.fabricateYear,
        modelYear: vehicle.modelYear,
        color: vehicle.color,
        km: vehicle.km,
        price: vehicle.price,
        transmissionType: vehicle.transmissionType || "manual",
        fuelType: vehicle.fuelType || "flex",
        licensePlate: vehicle.licensePlate || "",
        status: vehicle.status,
        description: vehicle.description || "",
      });
    } else {
      reset({
        make: "",
        model: "",
        fabricateYear: new Date().getFullYear(),
        modelYear: new Date().getFullYear(),
        color: "",
        km: 0,
        price: "",
        transmissionType: "manual",
        fuelType: "flex",
        licensePlate: "",
        status: "available",
        description: "",
      });
    }
  }, [vehicle, reset]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 10) {
      toast({
        title: "Muitas imagens",
        description: "Máximo de 10 imagens por veículo",
        variant: "destructive",
      });
      return;
    }

    setSelectedImages(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data: InsertVehicle) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      
      // Upload images if there are any and it's a new vehicle
      if (selectedImages.length > 0 && onUploadImages && !vehicle) {
        // Note: This would need the vehicle ID from the create response
        // For now, we'll handle image upload separately
      }
      
      handleClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar veículo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setGeneratedDescription("");
    setShowDescriptionActions(false);
    setIsEditingDescription(false);
    setTempDescription("");
    onClose();
  };

  const generateDescription = async () => {
    const formData = watch();
    
    if (!formData.make || !formData.model || !formData.fabricateYear || !formData.modelYear) {
      toast({
        title: "Dados incompletos",
        description: "Preencha marca, modelo e anos antes de gerar a descrição",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const data = await apiRequest("POST", "/api/vehicles/generate-description-preview", {
        make: formData.make,
        model: formData.model,
        fabricateYear: formData.fabricateYear,
        modelYear: formData.modelYear,
        color: formData.color || "N/A",
        km: formData.km || 0,
        price: formData.price || "0",
      });
      setGeneratedDescription(data.description);
      setTempDescription(data.description);
      setShowDescriptionActions(true);
      
      toast({
        title: "Descrição gerada",
        description: data.fallbackUsed ? 
          "Descrição gerada usando modo offline (sem IA)" : 
          "Descrição gerada com IA com sucesso!",
      });
    } catch (error) {
      console.error("Generate description error:", error);
      
      // Extract error message from response
      let errorMessage = "Não foi possível gerar a descrição";
      
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message.split(": ")[1]);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If parsing fails, use the original error message
          if (error.message.includes("500")) {
            errorMessage = "Erro interno do servidor - tente novamente";
          } else if (error.message.includes("401")) {
            errorMessage = "Não autorizado - faça login novamente";
          } else if (error.message.includes("403")) {
            errorMessage = "Permissão negada";
          }
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const confirmDescription = () => {
    setValue("description", tempDescription, {
      shouldValidate: true,
      shouldTouch: true,
      shouldDirty: true,
    });
    setShowDescriptionActions(false);
    setIsEditingDescription(false);
    toast({
      title: "Descrição confirmada",
      description: "A descrição foi salva no formulário",
    });
  };

  const cancelDescription = () => {
    setGeneratedDescription("");
    setTempDescription("");
    setShowDescriptionActions(false);
    setIsEditingDescription(false);
  };

  const startEditDescription = () => {
    setIsEditingDescription(true);
  };

  const saveEditDescription = () => {
    setGeneratedDescription(tempDescription);
    setIsEditingDescription(false);
  };

  const cancelEditDescription = () => {
    setTempDescription(generatedDescription);
    setIsEditingDescription(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle ? "Editar Veículo" : "Adicionar Veículo"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Marca</Label>
              <Combobox
                options={brandOptions}
                value={makeValue || ""}
                onValueChange={handleBrandChange}
                placeholder={brandsLoading ? "Carregando marcas..." : "Selecione ou digite uma marca"}
                searchPlaceholder="Buscar marca..."
                emptyText="Nenhuma marca encontrada"
                disabled={brandsLoading}
                allowCustomValue={true}
                onCustomValueCreate={handleCustomBrandCreate}
              />
              {errors.make && (
                <p className="text-sm text-red-600 mt-1">{errors.make.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                {...register("model")}
                placeholder="Ex: Corolla"
              />
              {errors.model && (
                <p className="text-sm text-red-600 mt-1">{errors.model.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="fabricateYear">Ano de Fabricação</Label>
              <Input
                id="fabricateYear"
                type="number"
                {...register("fabricateYear", { valueAsNumber: true })}
                placeholder="Ex: 2020"
              />
              {errors.fabricateYear && (
                <p className="text-sm text-red-600 mt-1">{errors.fabricateYear.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="modelYear">Ano do Modelo</Label>
              <Input
                id="modelYear"
                type="number"
                {...register("modelYear", { valueAsNumber: true })}
                placeholder="Ex: 2020"
              />
              {errors.modelYear && (
                <p className="text-sm text-red-600 mt-1">{errors.modelYear.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                {...register("color")}
                placeholder="Ex: Branco"
              />
              {errors.color && (
                <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="km">Quilometragem</Label>
              <Input
                id="km"
                type="number"
                {...register("km", { valueAsNumber: true })}
                placeholder="Ex: 50000"
              />
              {errors.km && (
                <p className="text-sm text-red-600 mt-1">{errors.km.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                {...register("price")}
                placeholder="Ex: 85000"
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="transmissionType">Tipo de Transmissão</Label>
              <Select
                value={transmissionValue}
                onValueChange={(value) => setValue("transmissionType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a transmissão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automática</SelectItem>
                  <SelectItem value="cvt">CVT</SelectItem>
                  <SelectItem value="semi_automatic">Semi-automática</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fuelType">Tipo de Combustível</Label>
              <Select
                value={fuelValue}
                onValueChange={(value) => setValue("fuelType", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o combustível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasoline">Gasolina</SelectItem>
                  <SelectItem value="ethanol">Etanol</SelectItem>
                  <SelectItem value="flex">Flex</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Elétrico</SelectItem>
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="licensePlate">Placa do Veículo</Label>
              <Input
                id="licensePlate"
                {...register("licensePlate")}
                placeholder="ABC-1234 ou ABC1B23"
                maxLength={8}
              />
              {errors.licensePlate && (
                <p className="text-sm text-red-600 mt-1">{errors.licensePlate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusValue}
                onValueChange={(value) => setValue("status", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="reserved">Reservado</SelectItem>
                  <SelectItem value="sold">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div>
              <Label>Imagens do Veículo</Label>
              <label
                htmlFor="vehicle-images"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer block"
              >
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar imagens ou arraste e solte
                  </p>
                  <p className="text-xs text-gray-500">
                    Máximo 10 imagens, até 5MB cada
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="vehicle-images"
                />
              </label>
            </div>

            {/* Image Preview Grid */}
            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Vehicle Description Section */}
          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Descrição do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Generation Controls */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateDescription}
                  disabled={isGeneratingDescription}
                  className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-200"
                >
                  {isGeneratingDescription ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Descrição com IA
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600">
                  Preencha os dados básicos e clique para gerar uma descrição profissional
                </p>
              </div>

              {/* Generated Description Display */}
              {showDescriptionActions && (
                <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-800">Descrição Gerada</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={startEditDescription}
                        disabled={isEditingDescription}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={cancelDescription}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={confirmDescription}
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-3 w-3" />
                        Confirmar
                      </Button>
                    </div>
                  </div>
                  
                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={tempDescription}
                        onChange={(e) => setTempDescription(e.target.value)}
                        className="min-h-[120px] resize-none"
                        placeholder="Edite a descrição..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEditDescription}
                        >
                          Cancelar Edição
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveEditDescription}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Salvar Edições
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded border text-sm leading-relaxed">
                      {generatedDescription}
                    </div>
                  )}
                </div>
              )}

              {/* Regular Description Field */}
              <div>
                <Label htmlFor="description">Descrição Final</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  value={descriptionValue || ""}
                  onChange={(e) => setValue("description", e.target.value)}
                  placeholder="A descrição aparecerá aqui após confirmação da IA, ou digite uma personalizada..."
                  className="min-h-[100px]"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Use a IA para gerar uma descrição profissional ou escreva uma personalizada
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Veículo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

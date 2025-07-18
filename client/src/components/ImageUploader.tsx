import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageUploaderProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
  maxFileSize?: number;
  className?: string;
  disabled?: boolean;
  existingImages?: File[];
}

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

export function ImageUploader({
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5,
  className = "",
  disabled = false,
  existingImages = [],
}: ImageUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLLabelElement>(null);
  const { toast } = useToast();

  // Effect to handle initial existing images and cleanup
  useEffect(() => {
    const initialFilesWithPreview: FileWithPreview[] = [];
    if (existingImages.length > 0) {
      existingImages.forEach((file) => {
        initialFilesWithPreview.push({
          file,
          preview: URL.createObjectURL(file),
          id: Math.random().toString(36).substr(2, 9),
        });
      });
      setFiles(initialFilesWithPreview);
    }

    // Cleanup function for all previews
    return () => {
      initialFilesWithPreview.forEach((f) => URL.revokeObjectURL(f.preview));
      files.forEach((f) => URL.revokeObjectURL(f.preview)); // Also clean up any files added later
    };
  }, [existingImages]); // Depend on existingImages to re-run if they change

  // Effect to clean up previews when files state changes (e.g., files are removed)
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) return "Apenas arquivos de imagem são permitidos";
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxFileSize) return `Arquivo muito grande. Máximo ${maxFileSize}MB permitido`;
    return null;
  };

  const processFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    // Check total image limit before processing
    if (files.length + fileArray.length > maxImages) {
      const remainingSlots = maxImages - files.length;
      const filesToAdd = fileArray.slice(0, remainingSlots);
      const rejectedCount = fileArray.length - filesToAdd.length;

      if (rejectedCount > 0) {
        toast({
          title: "Limite de imagens atingido",
          description: `Você pode adicionar apenas mais ${remainingSlots} imagem(ns). ${rejectedCount} arquivo(s) foram ignorado(s).`,
          variant: "destructive",
        });
        setFeedback(`Limite máximo de ${maxImages} imagens atingido. ${rejectedCount} arquivo(s) ignorado(s).`);
      }
      // Only process files that fit within the limit
      fileArray.splice(remainingSlots);
    }

    fileArray.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({ file, preview: URL.createObjectURL(file), id: Math.random().toString(36).substr(2, 9) });
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Alguns arquivos foram rejeitados",
        description: errors.join(", "),
        variant: "destructive",
      });
      setFeedback(errors.join(", "));
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onImagesChange(updatedFiles.map((f) => f.file));
      setFeedback(`${validFiles.length} imagem(ns) adicionada(s) com sucesso`);
      toast({ title: "Imagens adicionadas", description: `${validFiles.length} imagem(ns) adicionada(s) com sucesso` });
    }
  }, [files, maxImages, maxFileSize, onImagesChange, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) processFiles(selectedFiles);
    if (inputRef.current) inputRef.current.value = ""; // Clear input to allow re-uploading same file
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles.length > 0) processFiles(droppedFiles);
  };

  const removeFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview); // Clean up specific preview URL

    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onImagesChange(updatedFiles.map((f) => f.file));
    setFeedback("A imagem foi removida da seleção");
    toast({ title: "Imagem removida", description: "A imagem foi removida da seleção" });
  };

  const removeAllFiles = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    onImagesChange([]);
    setFeedback("Todas as imagens foram removidas");
    toast({ title: "Todas as imagens removidas", description: "Todas as imagens foram removidas da seleção" });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label
        ref={dropRef}
        htmlFor="vehicle-images"
        tabIndex={0}
        className={`relative block border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
          ${disabled ? "border-gray-200 bg-gray-50 cursor-not-allowed" : isDragOver ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="Área de upload de imagens - clique para selecionar arquivos"
        aria-disabled={disabled}
        onKeyDown={e => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          id="vehicle-images"
          disabled={disabled}
          aria-describedby="upload-instructions"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: disabled ? 'not-allowed' : 'pointer', zIndex: 10 }}
          tabIndex={-1}
        />
        <div className="space-y-4 select-none pointer-events-none">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isDragOver ? "bg-blue-100" : "bg-gray-100"}`}>
            <Upload className={`w-8 h-8 ${isDragOver ? "text-blue-600" : "text-gray-500"}`} />
          </div>
          <div>
            <p className={`text-lg font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>{isDragOver ? "Solte as imagens aqui" : "Clique ou pressione Enter para selecionar imagens"}</p>
            <p className={`text-sm mt-1 ${disabled ? "text-gray-400" : "text-gray-500"}`} id="upload-instructions">ou arraste e solte suas imagens aqui</p>
          </div>
          <div className={`text-xs space-y-1 ${disabled ? "text-gray-400" : "text-gray-500"}`}>
            <p>Máximo {maxImages} imagens • Até {maxFileSize}MB cada</p>
            <p>Formatos: JPG, PNG, GIF, WebP</p>
            <p className="text-green-600">{files.length}/{maxImages} imagens selecionadas</p>
          </div>
        </div>
      </label>
      <div aria-live="polite" className="sr-only">{feedback}</div>
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Imagens selecionadas ({files.length})</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={removeAllFiles}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-1" />
              Remover todas
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-square relative">
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                </div>
                <div className="p-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700 truncate" title={fileItem.file.name}>{fileItem.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(fileItem.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    removeFile(fileItem.id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`Remover ${fileItem.file.name}`}
                  disabled={disabled}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {files.length === maxImages && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-700">Limite máximo de {maxImages} imagens atingido</p>
        </div>
      )}
    </div>
  );
}
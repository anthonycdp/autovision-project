import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/styles/react-pdf.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText, AlertCircle, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { diagnosticPDFFile, logPDFDiagnostic } from "@/utils/pdfDiagnostic";

// CKDEV-NOTE: Configure PDF.js worker to use local file with proper fallback
try {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  console.log('✅ PDF.js worker configured locally');
} catch (error) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  console.warn('⚠️ Using CDN worker as fallback:', error);
}

interface DocumentViewerProps {
  document: {
    id: string;
    name: string;
    type: string;
    size: number;
    filePath: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // CKDEV-NOTE: Reset state when document changes or dialog opens/closes
  useEffect(() => {
    if (isOpen && document) {
      console.log('DocumentViewer opened for:', document);
      setPageNumber(1);
      setScale(1.0);
      setError(null);
      setIsLoading(true);
      setRetryCount(0);
      
      // Load text file content if needed
      if (document.type === 'txt' || document.type === 'md') {
        fetchTextContent();
      }
    }
  }, [isOpen, document]);

  // CKDEV-NOTE: Fetch text content for .txt and .md files
  const fetchTextContent = async () => {
    if (!document) return;
    
    try {
      const response = await fetch(`/api/documents/${document.id}/content`);
      if (!response.ok) throw new Error('Failed to fetch file content');
      const text = await response.text();
      setFileContent(text);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading text content:', err);
      setError('Erro ao carregar conteúdo do arquivo');
      setIsLoading(false);
    }
  };

  // CKDEV-NOTE: Handle keyboard shortcuts (ESC, arrows for PDF navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (document?.type === 'pdf' && pageNumber > 1) {
            setPageNumber(prev => prev - 1);
          }
          break;
        case 'ArrowRight':
          if (document?.type === 'pdf' && numPages && pageNumber < numPages) {
            setPageNumber(prev => prev + 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, document, pageNumber, numPages, onClose]);

  // CKDEV-NOTE: React-PDF callbacks - much simpler without usePdfLoader conflict
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('✅ PDF loaded successfully:', { numPages, documentId: document?.id });
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('❌ PDF load error:', error);
    setError(`Erro ao carregar PDF: ${error.message}`);
    setIsLoading(false);
    setRetryCount(prev => prev + 1);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleDownload = async () => {
    if (document) {
      try {
        await api.downloadDocument(document.id);
      } catch (error) {
        console.error('Download error:', error);
        setError('Erro ao fazer download do arquivo');
      }
    }
  };

  const handleOpenInNewTab = async () => {
    if (document) {
      try {
        await api.openDocumentInNewTab(document.id);
      } catch (error) {
        console.error('Open in new tab error:', error);
        setError('Erro ao abrir documento em nova aba');
      }
    }
  };

  const handleRetry = () => {
    if (document) {
      setError(null);
      setIsLoading(true);
      setRetryCount(0);
      
      // Force react-pdf to reload by resetting state
      setNumPages(null);
      setPageNumber(1);
    }
  };

  const renderContent = () => {
    if (!document) return null;

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
          <p className="text-center mb-4 max-w-md text-red-600">{error}</p>
          {retryCount > 0 && (
            <p className="text-sm text-orange-600 mb-4">
              Tentativas realizadas: {retryCount}
            </p>
          )}
          <Button onClick={handleRetry} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      );
    }

    if (isLoading && document.type === 'pdf') {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p>Carregando PDF...</p>
          {retryCount > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              Tentativa {retryCount}
            </p>
          )}
        </div>
      );
    }

    // PDF files - AIDEV-NOTE: Simplified to use only react-pdf without conflicts
    if (document.type === 'pdf') {
      return (
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Página {pageNumber} de {numPages || '?'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
              disabled={pageNumber >= (numPages || 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm">{Math.round(scale * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="border rounded-lg overflow-auto max-h-[60vh] bg-gray-50 dark:bg-gray-900">
            <Document
              file={`/api/documents/${document.id}/preview?token=${encodeURIComponent(api.getAccessToken() || '')}`}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Renderizando PDF...</p>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </div>
      );
    }

    // Image files
    if (['jpeg', 'jpg', 'png', 'webp'].includes(document.type)) {
      return (
        <div className="flex justify-center">
          <img
            src={`/api/documents/${document.id}/preview`}
            alt={document.name}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError('Erro ao carregar imagem');
              setIsLoading(false);
            }}
          />
        </div>
      );
    }

    // Text files
    if (document.type === 'txt' || document.type === 'md') {
      return (
        <div className="w-full">
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[60vh] text-sm">
            <code>{fileContent || 'Conteúdo vazio'}</code>
          </pre>
        </div>
      );
    }

    // Unsupported file types
    if (['docx', 'xlsx', 'xls', 'doc'].includes(document.type)) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="w-16 h-16 mb-4" />
          <p className="text-lg mb-2">Preview não disponível para este formato</p>
          <p className="text-sm mb-4">Arquivo: {document.name}</p>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Baixar Arquivo
          </Button>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <FileText className="w-16 h-16 mb-4" />
        <p className="mb-4">Tipo de arquivo não suportado para visualização</p>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Baixar Arquivo
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-[90vw] w-full max-h-[90vh] overflow-hidden",
        "lg:max-w-[80vw]"
      )}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Visualizar Documento</DialogTitle>
            {document && (
              <p className="text-sm text-gray-500 mt-1">
                {document.name} ({(document.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                title="Tentar carregar novamente"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              title="Abrir em nova aba"
              disabled={!document || isLoading}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Baixar arquivo"
              disabled={!document || isLoading}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="overflow-auto p-4">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
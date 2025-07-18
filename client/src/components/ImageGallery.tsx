import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  vehicleName: string;
}

export function ImageGallery({ images, vehicleName }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  const openGallery = (index: number) => {
    setCurrentImageIndex(index);
    setIsOpen(true);
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const closeGallery = () => {
    setIsOpen(false);
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          closeGallery();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 sm:h-[500px] lg:h-[600px] bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl">
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <Maximize2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{vehicleName}</h3>
            <p className="text-gray-600">Nenhuma foto disponível</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Image */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="relative group cursor-pointer" onClick={() => openGallery(0)}>
          <img
            src={images[0]}
            alt={`${vehicleName} - Foto principal`}
            className="w-full h-96 sm:h-[500px] lg:h-[600px] object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
              <Maximize2 className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{vehicleName}</h2>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {images.length} foto{images.length > 1 ? 's' : ''}
                </span>
                <span className="text-sm text-blue-600 font-medium">
                  Clique para ampliar
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.slice(1).map((imageUrl, index) => (
            <div 
              key={index + 1} 
              className="relative group cursor-pointer"
              onClick={() => openGallery(index + 1)}
            >
              <img
                src={imageUrl}
                alt={`${vehicleName} - Foto ${index + 2}`}
                className="w-full h-24 sm:h-32 object-cover rounded-xl border border-gray-200 group-hover:shadow-md transition-all group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-2">
                    <Maximize2 className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-none w-screen h-screen p-0 bg-black/80 border-0">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white border-0"
              onClick={closeGallery}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0 w-12 h-12"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white border-0 w-12 h-12"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center space-x-2 bg-black/50 rounded-lg px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-black/70 text-white border-0 w-8 h-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm px-2 py-1 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-black/70 text-white border-0 w-8 h-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                <span className="text-white text-sm px-3 py-1 bg-black/50 rounded">
                  {currentImageIndex + 1} de {images.length}
                </span>
              </div>
            )}

            {/* Main Image */}
            <div 
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={images[currentImageIndex]}
                alt={`${vehicleName} - Foto ${currentImageIndex + 1}`}
                className="w-full h-full object-contain transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                  cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                }}
                draggable={false}
              />
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 z-50 text-white text-xs bg-black/50 px-3 py-2 rounded hidden sm:block">
              <div>Use as setas ← → para navegar</div>
              <div>Scroll para zoom • ESC para fechar</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
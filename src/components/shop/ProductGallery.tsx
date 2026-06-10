/**
 * ============================================================================
 * PRODUCT GALLERY — KATALINA
 * ============================================================================
 * Imagen principal grande + thumbnails clickeables debajo.
 *
 * Client Component porque maneja estado de "qué imagen está activa".
 *
 * Si hay UNA sola imagen, ocultamos los thumbnails (no tiene sentido mostrar
 * un solo thumbnail).
 *
 * Misma estrategia de placeholder que ProductCard: si src empieza con
 * "/placeholder" muestra un fondo decorativo en lugar de intentar cargar.
 * ============================================================================
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = images[activeIndex];
  const hasMultipleImages = images.length > 1;
  const isPlaceholder = activeImage?.src.startsWith("/placeholder") ?? true;

  return (
    <div className="space-y-4">
      {/* Imagen principal */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full overflow-hidden",
          "bg-secondary-subtle"
        )}
      >
        {isPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
                Imagen {activeIndex + 1} de {images.length}
              </p>
              <p className="font-display text-2xl text-foreground">
                {productName}
              </p>
            </div>
          </div>
        ) : (
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Thumbnails — solo si hay más de 1 imagen */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const isActive = index === activeIndex;
            const isThumbPlaceholder = image.src.startsWith("/placeholder");

            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagen ${index + 1}: ${image.alt}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative aspect-square w-20 flex-shrink-0",
                  "overflow-hidden",
                  "border-2 transition-colors duration-200",
                  isActive
                    ? "border-accent"
                    : "border-transparent hover:border-border-strong",
                  "cursor-pointer"
                )}
              >
                {isThumbPlaceholder ? (
                  <div className="absolute inset-0 bg-secondary-subtle flex items-center justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                ) : (
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
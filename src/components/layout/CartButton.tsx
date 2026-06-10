/**
 * ============================================================================
 * CART BUTTON — KATALINA
 * ============================================================================
 *
 * Botón del carrito que aparece en el header. Muestra el icono ShoppingBag
 * y un badge con el número de items si hay alguno.
 *
 * Por qué un componente separado en lugar de inline en Header.tsx:
 *   1. ENCAPSULA el manejo de hidratación (ver abajo)
 *   2. AÍSLA el código Client en una isla pequeña, dejando el Header como
 *      Server Component si todo lo demás es estático
 *   3. REUTILIZABLE — eventualmente podríamos usarlo en otros sitios
 *      (ej. en una vista responsive del header móvil)
 *
 * El problema de hidratación con persist + Next.js:
 *
 *   Cuando Next.js pre-renderiza la página en el servidor, NO existe
 *   localStorage (es API exclusiva del navegador). El servidor renderiza
 *   `itemCount: 0`. El navegador recibe ese HTML, lo muestra, y después
 *   ejecuta React para "hidratar" (conectar el JS).
 *
 *   Al hidratar, Zustand lee localStorage. Si hay items, itemCount cambia
 *   inmediatamente. Pero React compara el HTML del servidor con el primer
 *   render del cliente — si difieren, lanza el "hydration mismatch" warning.
 *
 *   Solución estándar: durante el PRIMER render del cliente, mostramos lo
 *   mismo que mostró el servidor (sin badge). Solo después del primer render
 *   (cuando ya pasó la hidratación) leemos el carrito real.
 *
 *   Implementación: useState con flag `mounted` que se pone true en useEffect.
 *   useEffect solo corre en el cliente, así que el primer render del cliente
 *   tiene mounted=false (igual que servidor), y el segundo render ya mounted=true.
 *
 * Resultado: ZERO warnings de hydration, comportamiento esperado, badge
 * aparece después de un microsegundo (imperceptible).
 * ============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface CartButtonProps {
  /**
   * Clase opcional para el botón contenedor. Permite al Header personalizar
   * el tamaño, color, padding, etc. desde fuera.
   */
  className?: string;
}

export function CartButton({ className }: CartButtonProps) {
  const { itemCount } = useCart();

  /**
   * Flag `mounted` — true solo después del primer render del cliente.
   * Esto evita el hydration mismatch (ver explicación arriba).
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * `displayCount`: mientras no estamos "mounted" mostramos 0.
   * Después de mount, mostramos el valor real del store.
   *
   * Esto significa que durante el SSR y el primer render del cliente,
   * SIEMPRE renderizamos como si el carrito estuviera vacío. Después del
   * primer render, si hay items, el badge aparece.
   */
  const displayCount = mounted ? itemCount : 0;
  const showBadge = displayCount > 0;

  return (
    <Link
      href="/carrito"
      aria-label={
        showBadge
          ? `Carrito con ${displayCount} ${displayCount === 1 ? "item" : "items"}`
          : "Carrito vacío"
      }
      className={cn(
        "relative inline-flex items-center justify-center",
        "h-9 w-9", // Tamaño consistente con otros botones del header
        "text-foreground hover:text-accent transition-colors",
        className
      )}
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />

      {/*
       * Badge con el número.
       * Solo aparece si hay items (showBadge=true).
       *
       * Posicionado absoluto en la esquina superior derecha del icono.
       * Cobre como color del badge — destaca contra cualquier fondo
       * (sea el header normal o el header al hacer scroll).
       */}
      {showBadge && (
        <span
          className={cn(
            "absolute -top-1 -right-1",
            "min-w-[18px] h-[18px] px-1",
            "flex items-center justify-center",
            "bg-accent text-accent-foreground",
            "text-[10px] font-medium tabular-nums",
            "rounded-full",
            // Animación sutil de "pop" cuando aparece — no se ejecuta
            // continuamente, solo al montar
            "animate-in zoom-in-50 duration-200"
          )}
          aria-hidden="true" // El aria-label del link ya dice el conteo
        >
          {/* Si hay más de 99, mostramos "99+" para no romper el badge */}
          {displayCount > 99 ? "99+" : displayCount}
        </span>
      )}
    </Link>
  );
}
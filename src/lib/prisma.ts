// ============================================================================
//  MKatalina · Cliente de Prisma (singleton) · Fase 13 · Etapa 1
// ============================================================================
//
//  QUÉ HACE ESTE ARCHIVO
//  ---------------------
//  Crea UNA sola instancia compartida de PrismaClient para toda la app y la
//  exporta como `prisma`. En cualquier route handler o server action haremos:
//      import { prisma } from "@/lib/prisma";
//      const pedidos = await prisma.order.findMany();
//
//  ¿POR QUÉ UN SINGLETON Y NO "new PrismaClient()" cada vez?
//  --------------------------------------------------------
//  En desarrollo, Next.js recarga el código en caliente (hot reload) muchas
//  veces. Si creáramos un PrismaClient nuevo en cada recarga, se acumularían
//  decenas de conexiones a la base de datos hasta agotar el límite de Postgres
//  y romper la app con "too many connections". Guardar la instancia en el
//  objeto global evita que se recree en cada recarga.
//
//  En PRODUCCIÓN no guardamos en global (cada función serverless arranca
//  limpia), así que la condición de abajo solo aplica fuera de producción.
// ============================================================================

import { PrismaClient } from "@prisma/client";

// `globalThis` es el objeto global que SÍ sobrevive a las recargas en caliente
// de Next.js. Le añadimos (con tipado) un hueco opcional para nuestra instancia.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Reutiliza la instancia existente si ya la creamos; si no, crea una nueva.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Muestra en consola cada consulta SQL solo en desarrollo (útil para
    // depurar). En producción lo dejamos en silencio salvo errores.
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Solo fuera de producción cacheamos la instancia en el global para
// sobrevivir al hot reload (ver explicación de arriba).
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
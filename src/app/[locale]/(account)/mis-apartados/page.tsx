/**
 * ============================================================================
 * PAGE: /[locale]/(account)/mis-apartados — MKATALINA
 * ============================================================================
 *
 * Cambio de la Fase 13 (Etapa 3):
 *   - Los apartados ahora vienen de la base de datos (vía useReservations, que
 *     los trae al cargar). Como esa carga es asíncrona, agregamos un estado de
 *     CARGA: mientras `isLoading` es true, mostramos un placeholder en vez del
 *     empty state, para no mostrar "no tienes apartados" un instante antes de
 *     que lleguen los datos.
 *
 * Lo que NO cambia:
 *   - La lógica de tabs (activos / completados / historial)
 *   - El filtrado por status efectivo (active/completed/expired/cancelled)
 *   - El layout, tabs role/aria, empty states
 * ============================================================================
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BookmarkPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReservationCard } from "@/components/account/ReservationCard";
import { useReservations } from "@/hooks/use-reservations";
import { cn } from "@/lib/utils";

type TabId = "active" | "completed" | "history";

export default function ReservationsPage() {
  const t = useTranslations("reservation.page");

  const {
    activeReservations,
    completedReservations,
    expiredReservations,
    cancelledReservations,
    isLoading,
  } = useReservations();

  const [activeTab, setActiveTab] = useState<TabId>("active");

  // Historial = expirados + cancelados, ordenados por fecha (más reciente primero).
  const historyReservations = [
    ...expiredReservations,
    ...cancelledReservations,
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const totalCount =
    activeReservations.length +
    completedReservations.length +
    historyReservations.length;

  const tabs: Array<{
    id: TabId;
    label: string;
    count: number;
    reservations: typeof activeReservations;
  }> = [
    {
      id: "active",
      label: t("tabs.active"),
      count: activeReservations.length,
      reservations: activeReservations,
    },
    {
      id: "completed",
      label: t("tabs.completed"),
      count: completedReservations.length,
      reservations: completedReservations,
    },
    {
      id: "history",
      label: t("tabs.history"),
      count: historyReservations.length,
      reservations: historyReservations,
    },
  ];

  const currentTab = tabs.find((tab) => tab.id === activeTab)!;

  // Mientras carga no mostramos conteo (aún no es fiable).
  const subtitleText = isLoading
    ? ""
    : totalCount === 0
      ? t("subtitleEmpty")
      : totalCount === 1
        ? t("subtitleSingular", { count: totalCount })
        : t("subtitlePlural", { count: totalCount });

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">
          {t("title")}
        </h1>
        {subtitleText && (
          <p className="text-sm text-muted-foreground">{subtitleText}</p>
        )}
      </header>

      {isLoading ? (
        // Placeholder mientras se traen los apartados de la base.
        <div className="h-96" aria-hidden="true" />
      ) : totalCount === 0 ? (
        <EmptyAllReservations />
      ) : (
        <>
          {/* Tabs */}
          <div
            className="flex gap-1 border-b border-border"
            role="tablist"
            aria-label={t("tabsAriaLabel")}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-3",
                  "text-sm font-medium",
                  "transition-colors cursor-pointer",
                  "border-b-2 -mb-px",
                  "flex items-center gap-2",
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center",
                      "min-w-[20px] h-5 px-1.5 rounded-full",
                      "text-[10px] font-medium tabular-nums",
                      activeTab === tab.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Contenido del tab seleccionado */}
          <div role="tabpanel">
            {currentTab.reservations.length === 0 ? (
              <EmptyTabState tabId={activeTab} />
            ) : (
              <div className="space-y-4">
                {currentTab.reservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * EmptyAllReservations — empty state cuando NO hay apartados de ningún tipo.
 */
function EmptyAllReservations() {
  const t = useTranslations("reservation.page.emptyAll");

  return (
    <div className="py-16 lg:py-20 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-subtle mb-6">
        <BookmarkPlus
          className="h-7 w-7 text-accent"
          strokeWidth={1}
          aria-hidden="true"
        />
      </div>

      <h2 className="font-display text-2xl md:text-3xl font-medium mb-3">
        {t("title")}
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-3">
        {t("description")}
      </p>

      <p className="text-xs text-muted-foreground max-w-md mx-auto mb-8">
        {t("subtext")}
      </p>

      <Button asChild size="lg">
        <Link href="/aretes">{t("ctaButton")}</Link>
      </Button>
    </div>
  );
}

/**
 * EmptyTabState — empty state contextual al tab seleccionado.
 */
function EmptyTabState({ tabId }: { tabId: TabId }) {
  const t = useTranslations("reservation.page.emptyTab");

  const config = {
    active: {
      Icon: Clock,
      title: t("active.title"),
      description: t("active.description"),
    },
    completed: {
      Icon: BookmarkPlus,
      title: t("completed.title"),
      description: t("completed.description"),
    },
    history: {
      Icon: BookmarkPlus,
      title: t("history.title"),
      description: t("history.description"),
    },
  };

  const { Icon, title, description } = config[tabId];

  return (
    <div className="py-12 text-center">
      <Icon
        className="h-8 w-8 text-muted-foreground mx-auto mb-3"
        strokeWidth={1.5}
      />
      <p className="text-base font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
    </div>
  );
}
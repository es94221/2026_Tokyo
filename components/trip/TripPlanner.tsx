"use client";

import type { TripStatus } from "@/lib/types";
import { useTripPlanner } from "@/hooks/useTripPlanner";
import { Header } from "@/components/trip/Header";
import { Hero } from "@/components/trip/Hero";
import { OverallSection } from "@/components/trip/OverallSection";
import { OrdersSection } from "@/components/trip/OrdersSection";
import { WishlistSection } from "@/components/trip/WishlistSection";
import { MapSection } from "@/components/trip/MapSection";
import { PhotosSection } from "@/components/trip/PhotosSection";
import { DayPanel } from "@/components/trip/DayPanel";

type TripPlannerProps = {
  tripId: string;
  tripName: string;
  tripStatus?: TripStatus;
  onBackToHub: () => void;
};

export function TripPlanner({ tripId, tripName, tripStatus, onBackToHub }: TripPlannerProps) {
  const planner = useTripPlanner(tripId);

  if (!planner.hydrated) {
    return null;
  }

  const handleSyncClick = () => {
    if (planner.syncStatus === "error") {
      void planner.retrySync();
    }
  };

  return (
    <>
      <div className="grain" />
      <Header
        syncMessage={planner.syncMessage}
        syncStatus={planner.syncStatus}
        onSyncClick={handleSyncClick}
        tripName={tripName}
        onBackToHub={onBackToHub}
      />
      <main id="top">
        <Hero dayCount={planner.tripSettings.dayCount} tripName={tripName} tripStatus={tripStatus} />
        <OverallSection
          tripSettings={planner.tripSettings}
          days={planner.days}
          onUpdateSettings={planner.updateTripSettings}
          onClearItinerary={planner.clearItinerary}
          onOpenDay={planner.openDay}
          displayDayTitle={planner.displayDayTitle}
        />
        <OrdersSection
          orders={planner.orders}
          editingOrderIndex={planner.editingOrderIndex}
          onAdd={planner.addOrder}
          onEdit={planner.setEditingOrderIndex}
          onDelete={planner.deleteOrder}
          onCancelEdit={() => planner.setEditingOrderIndex(null)}
          formatOrderType={planner.formatOrderType}
        />
        <WishlistSection
          days={planner.days}
          wishes={planner.wishes}
          dayLabel={planner.dayLabel}
          onAdd={planner.addWish}
          onDelete={planner.deleteWish}
          onToggle={planner.toggleWish}
        />
        <MapSection />
        <PhotosSection
          photos={planner.photos}
          onAdd={(urls) => void planner.addPhotos(urls)}
          onDelete={(index) => void planner.deletePhoto(index)}
        />
      </main>
      <DayPanel
        panelMode={planner.panelMode}
        day={planner.panelDay}
        index={planner.panelIndex}
        allOrders={planner.orders}
        wishes={planner.wishes}
        displayDayTitle={planner.displayDayTitle}
        getOrdersForDay={planner.getOrdersForDay}
        formatOrderType={planner.formatOrderType}
        onClose={planner.closePanel}
        onEdit={planner.openDayEdit}
        onCancelEdit={(index) => planner.openDay(index)}
        onSaveEdit={planner.saveDayEdit}
      />
    </>
  );
}

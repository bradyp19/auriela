export type Category = 'hotel' | 'flight' | 'activity';
export type TravelDate = string; // YYYY-MM-DD, a calendar date, never a UTC timestamp.
export type Money = number; // Integer USD cents throughout the demo.
export interface SearchCriteria {
  category: Category; destination: string; origin: string;
  start: TravelDate; end: TravelDate; travelers: number; rooms: number;
  returnFlight: boolean; maxPrice: Money; refundable: boolean; nonstop: boolean;
  activityType: string; sort: 'recommended' | 'price-asc' | 'price-desc' | 'rating';
}
interface InventoryBase { id: string; name: string; destination: string; description: string; image: string; price: Money; rating: number; available: boolean; }
export interface Hotel extends InventoryBase {
  category: 'hotel'; area: string; stars: number; amenities: string[]; refundable: boolean;
  rooms: { id: string; name: string; supplement: Money; capacity: number; description: string }[];
}
export interface Flight extends InventoryBase {
  category: 'flight'; origin: string; airline: string; number: string; departure: string; arrival: string;
  originZone: string; destinationZone: string; duration: number; stops: number; baggage: string;
  segments: { from: string; to: string; departure: string; arrival: string; zoneFrom: string; zoneTo: string }[];
}
export interface Activity extends InventoryBase {
  category: 'activity'; duration: number; meeting: string; inclusions: string[]; options: string[];
  activityType: string; refundable: boolean; access: 'referral' | 'approved-booking';
}
export type Inventory = Hotel | Flight | Activity;
export interface Quote {
  id: string; inventoryId: string; roomId?: string; currency: 'USD'; demo: true;
  breakdown: { label: string; amount: Money }[]; total: Money; publicTotal: Money;
  retrievedAt: string; expiresAt: string; criteria: SearchCriteria; offer: 'public' | 'pro';
  cancellation: { refundable: boolean; deadline: string; penalty: Money };
}
export interface TripItem { id: string; inventoryId: string; category: Category; status: 'shortlisted' | 'selected'; snapshot: Quote; needsReview: boolean; }
export interface ItineraryEntry { id: string; itemId?: string; day: TravelDate; title: string; note: string; }
export interface Trip {
  id: string; name: string; destination: string; start: TravelDate; end: TravelDate; budget: Money;
  searches: SearchCriteria[]; items: TripItem[]; itinerary: ItineraryEntry[]; notes: string; bookingIds: string[];
}
export interface Booking {
  id: string; tripId: string; quote: Quote; traveler: { firstName: string; lastName: string; email: string };
  supplierState: 'confirmed' | 'cancelled'; paymentState: 'not-charged'; demo: true;
  createdAt: string; cancelledAt?: string; cancellationPenalty?: Money; idempotencyKey: string;
}
export interface Membership { tier: 'public' | 'pro'; demo: true; }
export interface AppData { version: 1; trips: Trip[]; activeTripId: string; favorites: string[]; bookings: Booking[]; membership: Membership; }
export type Scenario = 'normal' | 'price-change' | 'unavailable' | 'failure';
export type AssistantAction = { type: 'destination'; destination: string } | { type: 'dates'; start: string; end: string } | { type: 'budget'; amount: Money } | { type: 'search'; category: Category } | { type: 'add'; inventoryId: string } | { type: 'none' };
export interface AssistantResponse { message: string; action: AssistantAction; }

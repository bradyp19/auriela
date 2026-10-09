import type { AppData, AssistantResponse, Booking, Inventory, Membership, Quote, Scenario, SearchCriteria, Trip } from '@/domain/types';
export interface InventoryProvider { search(criteria: SearchCriteria, scenario?: Scenario): Promise<Inventory[]>; }
export interface QuoteProvider { refresh(item: Inventory, criteria: SearchCriteria, offer: 'public'|'pro', roomId?: string, scenario?: Scenario): Promise<Quote>; }
export interface BookingProvider { book(quote: Quote, tripId: string, traveler: Booking['traveler'], key: string, scenario?: Scenario): Promise<Booking>; cancel(booking: Booking): Promise<Booking>; }
export interface TripStorage { load(): { data: AppData; warning?: string }; save(data: AppData): void; reset(): AppData; }
export interface MembershipProvider { preview(tier: Membership['tier']): Promise<Membership>; }
export interface AssistantProvider { respond(message: string, trip: Trip): Promise<AssistantResponse>; }

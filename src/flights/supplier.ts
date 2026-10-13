import type {
  FlightMode,
  FlightOffer,
  FlightRequest,
  SupplierOutcome,
} from "./types";

export interface FlightSearchResult {
  mode: FlightMode;
  label: string;
  coverage: string;
  offers: FlightOffer[];
}
export type FlightRefreshResult =
  | { mode: FlightMode; label: string; status: "available"; offer: FlightOffer }
  | { mode: FlightMode; label: string; status: "unavailable" };
export interface FlightSupplier {
  readonly mode: FlightMode;
  search(request: FlightRequest): Promise<FlightSearchResult>;
  refresh(offer: FlightOffer): Promise<FlightRefreshResult>;
  checkout(offer: FlightOffer, attemptId: string): Promise<SupplierOutcome>;
  verify(attemptId: string): Promise<SupplierOutcome>;
}

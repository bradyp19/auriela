export type FlightMode = "fixture" | "sandbox";
export type FlightCabin = "economy" | "business";
export type FixtureScenario =
  "normal" | "price-change" | "terms-change" | "unavailable" | "uncertain";
export interface FlightRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: 1;
  cabin: FlightCabin;
}
export interface FlightAirport {
  code: string;
  name: string;
  country: "US";
  timeZone: string;
}
export interface FlightSegment {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  departureTimeZone: string;
  arrivalTimeZone: string;
  airline: string;
  flightNumber: string;
  cabin: FlightCabin;
}
export interface FlightOffer {
  id: string;
  mode: FlightMode;
  label: string;
  request: FlightRequest;
  outbound: FlightSegment[];
  return: FlightSegment[];
  price: {
    currency: "USD";
    base: number;
    taxes: number;
    mandatoryFees: number;
    total: number;
  };
  baggage: string;
  terms: { cancellation: string; changes: string };
  expiresAt: string;
  coverage: string;
}
export type SupplierOutcome =
  | {
      mode: "fixture";
      status: "verification_pending" | "simulated_complete" | "failed";
      label: string;
      message: string;
      supplierReference?: string;
      ticketReference?: string;
    }
  | {
      mode: "sandbox";
      status: "verification_pending" | "verified_complete" | "failed";
      label: string;
      message: string;
      supplierReference?: string;
      ticketReference?: string;
    };
export type FlightAction =
  | { type: "request"; request: FlightRequest; scenario?: FixtureScenario }
  | {
      type: "approve";
      journeyId: string;
      offerId: string;
      offerRevision: string;
      accepted: true;
    }
  | { type: "checkout"; journeyId: string }
  | { type: "verify"; journeyId: string }
  | { type: "reminder"; journeyId: string; enabled: false }
  | {
      type: "reminder";
      journeyId: string;
      enabled: true;
      leadMinutes: number;
      fallbackAccepted: true;
    };
export type FlightJourneyStatus =
  | "review"
  | "approved"
  | "verification_pending"
  | "simulated_complete"
  | "verified_complete"
  | "unavailable"
  | "failed";
export interface FlightJourney {
  id: string;
  request: FlightRequest;
  scenario: FixtureScenario;
  mode: FlightMode;
  status: FlightJourneyStatus;
  offer: FlightOffer | null;
  offerRevision: string | null;
  approval: {
    offerId: string;
    offerRevision: string;
    approvedAt: string;
  } | null;
  attempt: {
    id: string;
    status:
      | "verification_pending"
      | "simulated_complete"
      | "verified_complete"
      | "failed";
    startedAt: string;
    outcome: SupplierOutcome | null;
  } | null;
  messages: {
    id: string;
    role: "user" | "assistant";
    text: string;
    createdAt: string;
  }[];
  reminder: {
    enabled: boolean;
    leadMinutes: number;
    fallbackAccepted: true;
    dueAt: string;
    deliveredAt: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

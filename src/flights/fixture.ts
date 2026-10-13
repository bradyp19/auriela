import type { FlightSupplier } from "./supplier";
import type {
  FixtureScenario,
  FlightOffer,
  FlightRequest,
  FlightSegment,
  SupplierOutcome,
} from "./types";
import {
  airportLocalDate,
  flightAirport,
  flightOfferSchema,
  flightRequestSchema,
} from "./validation";

const label = "Simulated fixture — no payment or real ticket";
const coverage =
  "Synthetic fixture inventory only: three direct offers between supported US airports; no live airline search.";
const hourInZone = (instant: Date, timeZone: string) =>
  Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(instant),
  );
function zonedTimestamp(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const offset = parts.timeZoneName.replace("GMT", "") || "+00:00";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}
function localDeparture(date: string, hour: number, timeZone: string) {
  const target = Date.parse(`${date}T${String(hour).padStart(2, "0")}:00:00Z`);
  let instant = target;
  for (let iteration = 0; iteration < 2; iteration++) {
    const local = zonedTimestamp(new Date(instant), timeZone).slice(0, 19);
    instant += target - Date.parse(`${local}Z`);
  }
  return zonedTimestamp(new Date(instant), timeZone);
}
function segment(
  origin: string,
  destination: string,
  date: string,
  hour: number,
  cabin: FlightRequest["cabin"],
  flightNumber: string,
): FlightSegment {
  const departureTimeZone = flightAirport(origin)!.timeZone,
    arrivalTimeZone = flightAirport(destination)!.timeZone;
  const departureAt = localDeparture(date, hour, departureTimeZone);
  // shortcut: synthetic six-hour direct segments; replace schedules only with verified supplier inventory.
  const arrivalAt = zonedTimestamp(
    new Date(Date.parse(departureAt) + 6 * 60 * 60 * 1000),
    arrivalTimeZone,
  );
  return {
    origin,
    destination,
    departureAt,
    arrivalAt,
    departureTimeZone,
    arrivalTimeZone,
    airline: "Fixture Air (simulated)",
    flightNumber,
    cabin,
  };
}
export function createFixtureSupplier({
  now = () => new Date(),
  scenario = "normal",
}: { now?: () => Date; scenario?: FixtureScenario } = {}): FlightSupplier {
  const complete = (attemptId: string): SupplierOutcome => ({
    mode: "fixture",
    label,
    status: "simulated_complete",
    message:
      "Simulated reservation completed. No payment was taken and no real ticket was issued.",
    supplierReference: `fixture-${attemptId}`,
    ticketReference: `simulated-ticket-${attemptId}`,
  });
  return {
    mode: "fixture",
    async search(input) {
      const instant = now(),
        request = flightRequestSchema(instant).parse(input);
      const originZone = flightAirport(request.origin)!.timeZone;
      const departureHour =
        request.departureDate === airportLocalDate(instant, originZone)
          ? Math.max(6, hourInZone(instant, originZone) + 1)
          : 6;
      if (departureHour > 23)
        return { mode: "fixture", label, coverage, offers: [] };
      const outbound = [
        segment(
          request.origin,
          request.destination,
          request.departureDate,
          departureHour,
          request.cabin,
          "FX101",
        ),
      ];
      const inbound: FlightSegment[] = [];
      if (request.returnDate) {
        const destinationZone = flightAirport(request.destination)!.timeZone;
        const arrival = new Date(outbound[0].arrivalAt);
        const arrivalDate = airportLocalDate(arrival, destinationZone);
        if (request.returnDate < arrivalDate)
          return { mode: "fixture", label, coverage, offers: [] };
        const returnHour =
          request.returnDate === arrivalDate
            ? Math.max(20, hourInZone(arrival, destinationZone) + 2)
            : 20;
        if (returnHour > 23)
          return { mode: "fixture", label, coverage, offers: [] };
        inbound.push(
          segment(
            request.destination,
            request.origin,
            request.returnDate,
            returnHour,
            request.cabin,
            "FX102",
          ),
        );
      }
      const multiplier =
        (request.cabin === "business" ? 3 : 1) * (request.returnDate ? 2 : 1);
      const offers = [28000, 24000, 32000].map((amount, index): FlightOffer => {
        const total = amount * multiplier;
        return flightOfferSchema.parse({
          id: `fixture-${request.origin}-${request.destination}-${request.departureDate}-${request.returnDate ?? "oneway"}-${request.cabin}-${index}`,
          mode: "fixture",
          label,
          request,
          outbound,
          return: inbound,
          price: {
            currency: "USD",
            base: total - 4000,
            taxes: 3000,
            mandatoryFees: 1000,
            total,
          },
          baggage: "Simulated: one cabin bag and one checked bag included.",
          terms: {
            cancellation: "Simulated fare is nonrefundable after checkout.",
            changes:
              "Simulated changes require a $50 fee plus fare difference.",
          },
          expiresAt: new Date(instant.getTime() + 15 * 60 * 1000).toISOString(),
          coverage,
        });
      });
      return { mode: "fixture", label, coverage, offers };
    },
    async refresh(input) {
      const offer = flightOfferSchema.parse(input);
      if (offer.mode !== "fixture")
        throw new Error("Fixture supplier accepts only fixture offers");
      if (
        scenario === "unavailable" ||
        Date.parse(offer.expiresAt) <= now().getTime() ||
        Date.parse(offer.outbound[0].departureAt) <= now().getTime()
      )
        return { mode: "fixture", label, status: "unavailable" };
      if (scenario === "price-change" && !offer.id.endsWith("-price-change"))
        return {
          mode: "fixture",
          label,
          status: "available",
          offer: {
            ...offer,
            id: `${offer.id}-price-change`,
            price: {
              ...offer.price,
              base: offer.price.base + 3500,
              total: offer.price.total + 3500,
            },
          },
        };
      if (scenario === "terms-change" && !offer.id.endsWith("-terms-change"))
        return {
          mode: "fixture",
          label,
          status: "available",
          offer: {
            ...offer,
            id: `${offer.id}-terms-change`,
            terms: {
              ...offer.terms,
              changes:
                "Simulated changes require a $100 fee plus fare difference.",
            },
          },
        };
      return { mode: "fixture", label, status: "available", offer };
    },
    async checkout(input, attemptId) {
      const offer = flightOfferSchema.parse(input);
      if (offer.mode !== "fixture")
        throw new Error("Fixture supplier accepts only fixture offers");
      if (!attemptId.trim())
        throw new Error("A durable attempt identity is required");
      if (
        scenario === "unavailable" ||
        Date.parse(offer.expiresAt) <= now().getTime()
      )
        return {
          mode: "fixture",
          label,
          status: "failed",
          message: "Simulated offer is unavailable; no payment was taken.",
        };
      if (scenario === "uncertain")
        return {
          mode: "fixture",
          label,
          status: "verification_pending",
          message:
            "Simulated completion timed out. Verify this existing attempt before trying again.",
          supplierReference: `fixture-${attemptId}`,
        };
      return complete(attemptId);
    },
    async verify(attemptId) {
      if (!attemptId.trim())
        throw new Error("An existing attempt identity is required");
      return complete(attemptId);
    },
  };
}

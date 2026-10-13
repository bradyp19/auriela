import { z } from "zod";
import { validDate } from "@/domain/dates";
import type { FlightAirport, FlightOffer, FlightRequest } from "./types";

export const flightAirports: readonly FlightAirport[] = [
  ["JFK", "New York JFK", "America/New_York"],
  ["LGA", "New York LaGuardia", "America/New_York"],
  ["EWR", "Newark", "America/New_York"],
  ["BOS", "Boston", "America/New_York"],
  ["IAD", "Washington Dulles", "America/New_York"],
  ["DCA", "Washington National", "America/New_York"],
  ["ATL", "Atlanta", "America/New_York"],
  ["MIA", "Miami", "America/New_York"],
  ["MCO", "Orlando", "America/New_York"],
  ["ORD", "Chicago", "America/Chicago"],
  ["DFW", "Dallas Fort Worth", "America/Chicago"],
  ["IAH", "Houston", "America/Chicago"],
  ["DEN", "Denver", "America/Denver"],
  ["PHX", "Phoenix", "America/Phoenix"],
  ["LAS", "Las Vegas", "America/Los_Angeles"],
  ["LAX", "Los Angeles", "America/Los_Angeles"],
  ["SFO", "San Francisco", "America/Los_Angeles"],
  ["SEA", "Seattle", "America/Los_Angeles"],
  ["SAN", "San Diego", "America/Los_Angeles"],
  ["AUS", "Austin", "America/Chicago"],
  ["BNA", "Nashville", "America/Chicago"],
  ["PDX", "Portland", "America/Los_Angeles"],
  ["HNL", "Honolulu", "Pacific/Honolulu"],
  ["ANC", "Anchorage", "America/Anchorage"],
  ["SLC", "Salt Lake City", "America/Denver"],
  ["DTW", "Detroit", "America/Detroit"],
  ["CLT", "Charlotte", "America/New_York"],
  ["PHL", "Philadelphia", "America/New_York"],
  ["MSP", "Minneapolis", "America/Chicago"],
].map(([code, name, timeZone]) => ({ code, name, country: "US", timeZone }));
export const flightAirport = (code: string) =>
  flightAirports.find((airport) => airport.code === code);
export function airportLocalDate(
  value: Date | string,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
const identifier = z.string().trim().min(1).max(200);
const airportCode = z
  .string()
  .refine(
    (value) => Boolean(flightAirport(value)),
    "Choose a supported US airport",
  );
const calendarDate = z
  .string()
  .refine(validDate, "Choose a real calendar date");
const cabin = z.enum(["economy", "business"]);
const requestFields = z.strictObject({
  origin: airportCode,
  destination: airportCode,
  departureDate: calendarDate,
  returnDate: calendarDate.optional(),
  adults: z.literal(1),
  cabin,
});
const calendarRequest = requestFields.superRefine((request, context) => {
  if (request.origin === request.destination)
    context.addIssue({
      code: "custom",
      path: ["destination"],
      message: "Choose different airports",
    });
  if (request.returnDate && request.returnDate < request.departureDate)
    context.addIssue({
      code: "custom",
      path: ["returnDate"],
      message: "Return must be on or after departure",
    });
});
export function flightRequestSchema(now = new Date()) {
  return calendarRequest.superRefine((request, context) => {
    const airport = flightAirport(request.origin);
    if (
      airport &&
      request.departureDate < airportLocalDate(now, airport.timeZone)
    )
      context.addIssue({
        code: "custom",
        path: ["departureDate"],
        message: "Departure date is in the past",
      });
  });
}
const timestamp = z.iso.datetime({ offset: true });
const nonnegativeCents = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const requiredTerms = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !/^unknown$/i.test(value), "Approval terms must be known");
const segmentSchema = z
  .strictObject({
    origin: airportCode,
    destination: airportCode,
    departureAt: timestamp,
    arrivalAt: timestamp,
    departureTimeZone: identifier,
    arrivalTimeZone: identifier,
    airline: identifier,
    flightNumber: identifier,
    cabin,
  })
  .superRefine((segment, context) => {
    if (
      segment.origin === segment.destination ||
      Date.parse(segment.arrivalAt) <= Date.parse(segment.departureAt)
    )
      context.addIssue({
        code: "custom",
        message: "Segment must travel between airports in chronological order",
      });
    if (
      segment.departureTimeZone !== flightAirport(segment.origin)?.timeZone ||
      segment.arrivalTimeZone !== flightAirport(segment.destination)?.timeZone
    )
      context.addIssue({
        code: "custom",
        message: "Segment time zones must match airports",
      });
  });
export const flightOfferSchema = z
  .strictObject({
    id: identifier,
    mode: z.enum(["fixture", "sandbox"]),
    label: identifier,
    request: calendarRequest,
    outbound: z.array(segmentSchema).min(1),
    return: z.array(segmentSchema),
    price: z.strictObject({
      currency: z.literal("USD"),
      base: nonnegativeCents,
      taxes: nonnegativeCents,
      mandatoryFees: nonnegativeCents,
      total: nonnegativeCents.positive(),
    }),
    baggage: identifier,
    terms: z.strictObject({
      cancellation: requiredTerms,
      changes: requiredTerms,
    }),
    expiresAt: timestamp,
    coverage: z.string().min(1),
  })
  .superRefine((offer, context) => {
    if (offer.mode === "fixture" && !/simulated/i.test(offer.label))
      context.addIssue({
        code: "custom",
        path: ["label"],
        message: "Fixture offers must be labeled simulated",
      });
    if (
      offer.price.base + offer.price.taxes + offer.price.mandatoryFees !==
      offer.price.total
    )
      context.addIssue({
        code: "custom",
        path: ["price"],
        message: "Total must include every mandatory charge",
      });
    const legs = [
      {
        segments: offer.outbound,
        origin: offer.request.origin,
        destination: offer.request.destination,
        date: offer.request.departureDate,
      },
    ];
    if (offer.request.returnDate)
      legs.push({
        segments: offer.return,
        origin: offer.request.destination,
        destination: offer.request.origin,
        date: offer.request.returnDate,
      });
    else if (offer.return.length)
      context.addIssue({
        code: "custom",
        path: ["return"],
        message: "One-way offers cannot have return segments",
      });
    for (const leg of legs) {
      const first = leg.segments[0],
        last = leg.segments.at(-1);
      const originAirport = flightAirport(leg.origin);
      if (
        !first ||
        !last ||
        !originAirport ||
        first.origin !== leg.origin ||
        last.destination !== leg.destination ||
        !Number.isFinite(Date.parse(first.departureAt)) ||
        airportLocalDate(first.departureAt, originAirport.timeZone) !== leg.date
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Flight segments must match requested airports and local dates",
        });
      }
      leg.segments.forEach((segment, index) => {
        const previous = leg.segments[index - 1];
        if (
          segment.cabin !== offer.request.cabin ||
          (previous &&
            (previous.destination !== segment.origin ||
              Date.parse(previous.arrivalAt) > Date.parse(segment.departureAt)))
        )
          context.addIssue({
            code: "custom",
            message: "Flight connections and cabin must match",
          });
      });
    }
    const outboundArrival = offer.outbound.at(-1);
    if (
      offer.return.length &&
      outboundArrival &&
      Date.parse(offer.return[0].departureAt) <=
        Date.parse(outboundArrival.arrivalAt)
    )
      context.addIssue({
        code: "custom",
        message: "Return must depart after outbound arrival",
      });
  });
export function lowestMatchingOffer(
  request: FlightRequest,
  offers: readonly unknown[],
  now = new Date(),
): FlightOffer | null {
  let lowest: FlightOffer | null = null;
  for (const candidate of offers) {
    const parsed = flightOfferSchema.safeParse(candidate);
    if (!parsed.success) continue;
    const offer = parsed.data;
    if (
      offer.request.origin !== request.origin ||
      offer.request.destination !== request.destination ||
      offer.request.departureDate !== request.departureDate ||
      offer.request.returnDate !== request.returnDate ||
      offer.request.cabin !== request.cabin ||
      offer.request.adults !== request.adults ||
      Date.parse(offer.expiresAt) <= now.getTime() ||
      Date.parse(offer.outbound[0].departureAt) <= now.getTime()
    )
      continue;
    if (!lowest || offer.price.total < lowest.price.total) lowest = offer;
  }
  return lowest;
}
export const flightActionSchema = z.union([
  z.discriminatedUnion("type", [
    z.strictObject({
      type: z.literal("request"),
      request: calendarRequest,
      scenario: z
        .enum([
          "normal",
          "price-change",
          "terms-change",
          "unavailable",
          "uncertain",
        ])
        .optional(),
    }),
    z.strictObject({
      type: z.literal("approve"),
      journeyId: identifier,
      offerId: identifier,
      accepted: z.literal(true),
    }),
    z.strictObject({ type: z.literal("checkout"), journeyId: identifier }),
    z.strictObject({ type: z.literal("verify"), journeyId: identifier }),
  ]),
  z.discriminatedUnion("enabled", [
    z.strictObject({
      type: z.literal("reminder"),
      journeyId: identifier,
      enabled: z.literal(false),
    }),
    z.strictObject({
      type: z.literal("reminder"),
      journeyId: identifier,
      enabled: z.literal(true),
      leadMinutes: z.number().int().min(1).max(1440),
      fallbackAccepted: z.literal(true),
    }),
  ]),
]);

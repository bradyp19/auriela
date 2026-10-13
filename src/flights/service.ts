import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { FlightSupplier } from "./supplier";
import type {
  FixtureScenario,
  FlightAction,
  FlightJourney,
  FlightOffer,
  FlightMode,
  SupplierOutcome,
} from "./types";
import { FlightRepository } from "./repository";
import { FlightError } from "./errors";
import {
  flightActionSchema,
  flightOfferSchema,
  flightRequestSchema,
  lowestMatchingOffer,
} from "./validation";

const modeSchema = z.enum(["fixture", "sandbox"]);
const text = z.string().trim().min(1).max(2000);
const reference = z.string().trim().min(1).max(200);
const searchSchema = z.object({
  mode: modeSchema,
  label: text,
  coverage: text,
  offers: z.array(z.unknown()),
});
const refreshSchema = z.discriminatedUnion("status", [
  z.object({
    mode: modeSchema,
    label: text,
    status: z.literal("available"),
    offer: flightOfferSchema,
  }),
  z.object({ mode: modeSchema, label: text, status: z.literal("unavailable") }),
]);
const outcomeSchema = z.object({
  mode: modeSchema,
  label: text,
  message: text,
  status: z.enum([
    "verification_pending",
    "simulated_complete",
    "verified_complete",
    "failed",
  ]),
  supplierReference: reference.optional(),
  ticketReference: reference.optional(),
});
const pendingText =
  "The outcome is unknown. Verify this existing attempt before starting another purchase.";
const complete = (journey: FlightJourney) =>
  journey.status === "simulated_complete" ||
  journey.status === "verified_complete";
const offerApproval = (offer: FlightOffer) =>
  JSON.stringify([
    offer.id,
    offer.mode,
    offer.request,
    offer.outbound,
    offer.return,
    offer.price,
    offer.baggage,
    offer.terms,
  ]);
function outcome(value: unknown, mode: FlightMode): SupplierOutcome {
  const parsed = outcomeSchema.safeParse(value);
  let status: SupplierOutcome["status"] = "verification_pending";
  if (parsed.success && parsed.data.mode === mode) {
    const result = parsed.data;
    if (result.status === "failed") status = "failed";
    if (mode === "fixture" && result.status === "simulated_complete")
      status = "simulated_complete";
    if (
      mode === "sandbox" &&
      result.status === "verified_complete" &&
      result.supplierReference &&
      result.ticketReference
    )
      status = "verified_complete";
  }
  const details =
    parsed.success && parsed.data.mode === mode
      ? {
          supplierReference: parsed.data.supplierReference,
          ticketReference: parsed.data.ticketReference,
        }
      : {};
  const message =
    status === "simulated_complete"
      ? "Simulated reservation completed. No payment was taken and no real ticket was issued."
      : status === "verified_complete"
        ? "Sandbox supplier completion and ticket evidence verified. This is a test booking."
        : status === "failed"
          ? "The supplier reports this attempt failed."
          : pendingText;
  return {
    mode,
    status,
    label:
      mode === "fixture"
        ? "Simulated fixture — no payment or real ticket"
        : "Sandbox test booking",
    message,
    ...details,
  } as SupplierOutcome;
}

export class FlightService {
  constructor(
    private readonly repository: FlightRepository,
    private readonly supplierFactory: (
      scenario: FixtureScenario,
    ) => FlightSupplier,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async get(sessionId: string): Promise<FlightJourney | null> {
    return this.repository.update(sessionId, (journey) => {
      if (journey) this.deliverReminder(journey);
      return journey;
    });
  }

  async act(sessionId: string, input: FlightAction): Promise<FlightJourney> {
    const parsed = flightActionSchema.safeParse(input);
    if (!parsed.success)
      throw new FlightError(
        "Invalid flight action. Check the selected fields.",
        400,
      );
    const action = parsed.data;
    if (action.type === "request") return this.search(sessionId, action);
    const journey = await this.get(sessionId);
    this.requireJourney(journey, action.journeyId);
    if (action.type === "checkout") return this.checkout(sessionId, journey);
    if (action.type === "verify") {
      if (!journey.attempt)
        throw new FlightError("There is no existing attempt to verify.");
      if (journey.attempt.status !== "verification_pending") return journey;
      const supplier = this.supplierFactory(journey.scenario);
      if (supplier.mode !== journey.mode)
        throw new FlightError("The supplier for this attempt is unavailable.");
      let result: unknown;
      try {
        result = await supplier.verify(journey.attempt.id);
      } catch {
        result = null;
      }
      return this.recordOutcome(sessionId, journey, result);
    }
    return this.change(sessionId, action.journeyId, (current) => {
      if (action.type === "approve") {
        if (current.attempt)
          throw new FlightError("This journey already has a booking attempt.");
        if (
          !current.offer ||
          current.offer.id !== action.offerId ||
          current.status === "unavailable"
        )
          throw new FlightError("Review the current offer before approving.");
        if (!this.usable(current.offer, current))
          throw new FlightError(
            "This offer has expired or departed. Search again.",
          );
        current.approval = {
          offerId: current.offer.id,
          approvedAt: this.now().toISOString(),
        };
        current.status = "approved";
        this.message(
          current,
          "user",
          "I approve this exact itinerary, total price, baggage and fare terms.",
        );
      } else if (action.enabled) {
        if (!complete(current) || !current.offer)
          throw new FlightError(
            "Complete and verify the booking before enabling a reminder.",
          );
        const dueAt = new Date(
          Date.parse(current.offer.outbound[0].departureAt) -
            action.leadMinutes * 60000,
        ).toISOString();
        const deliveredAt = current.reminder?.deliveredAt ?? null;
        current.reminder = {
          enabled: true,
          leadMinutes: action.leadMinutes,
          fallbackAccepted: true,
          dueAt,
          deliveredAt,
        };
        this.deliverReminder(current);
      } else if (current.reminder) current.reminder.enabled = false;
    });
  }

  private async search(
    sessionId: string,
    action: Extract<FlightAction, { type: "request" }>,
  ): Promise<FlightJourney> {
    const parsed = flightRequestSchema(this.now()).safeParse(action.request);
    if (!parsed.success)
      throw new FlightError(
        "Invalid flight request. Check airports and travel dates.",
        400,
      );
    const scenario = action.scenario ?? "normal";
    const supplier = this.supplierFactory(scenario);
    const timestamp = this.now().toISOString();
    const journey = this.repository.update(sessionId, (existing) => {
      if (existing?.attempt?.status === "verification_pending")
        throw new FlightError(
          "Verify the unresolved attempt before starting another request.",
        );
      const next: FlightJourney = {
        id: randomUUID(),
        request: parsed.data,
        scenario,
        mode: supplier.mode,
        status: "review",
        offer: null,
        approval: null,
        attempt: null,
        messages: [],
        reminder: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      this.message(
        next,
        "user",
        `Find a ${parsed.data.cabin} flight from ${parsed.data.origin} to ${parsed.data.destination} on ${parsed.data.departureDate}${parsed.data.returnDate ? `, returning ${parsed.data.returnDate}` : ""}.`,
      );
      return next;
    })!;
    let result;
    try {
      result = searchSchema.parse(
        await supplier.search(structuredClone(parsed.data)),
      );
      if (result.mode !== supplier.mode)
        throw new Error("Supplier mode mismatch");
    } catch {
      this.change(sessionId, journey.id, (current) => {
        current.status = "failed";
        this.message(
          current,
          "assistant",
          "The supplier search could not be validated. Try searching again.",
        );
      });
      throw new FlightError("The supplier search could not be validated.");
    }
    const offer = lowestMatchingOffer(
      parsed.data,
      result.offers.filter(
        (value) =>
          flightOfferSchema.safeParse(value).success &&
          (value as FlightOffer).mode === supplier.mode,
      ),
      this.now(),
    );
    return this.change(sessionId, journey.id, (current) => {
      current.offer = offer;
      current.status = offer ? "review" : "unavailable";
      this.message(
        current,
        "assistant",
        offer
          ? "Review the lowest total payable matching offer in the stated searched inventory, including itinerary, baggage and fare terms, before approving."
          : "No available matching offer was returned by the supplier.",
      );
    });
  }

  private async checkout(
    sessionId: string,
    journey: FlightJourney,
  ): Promise<FlightJourney> {
    if (journey.attempt) return journey;
    if (
      !journey.offer ||
      journey.status !== "approved" ||
      journey.approval?.offerId !== journey.offer.id
    )
      throw new FlightError("Approve the current offer before checkout.");
    if (!this.usable(journey.offer, journey))
      return this.unavailable(sessionId, journey.id);
    const supplier = this.supplierFactory(journey.scenario);
    if (supplier.mode !== journey.mode)
      throw new FlightError("The supplier for this offer is unavailable.");
    let refreshed;
    try {
      refreshed = refreshSchema.parse(
        await supplier.refresh(structuredClone(journey.offer)),
      );
      if (refreshed.mode !== journey.mode)
        throw new Error("Supplier mode mismatch");
      if (
        refreshed.status === "available" &&
        (refreshed.offer.mode !== journey.mode ||
          !lowestMatchingOffer(journey.request, [refreshed.offer], new Date(0)))
      )
        throw new Error("Invalid refreshed itinerary");
    } catch {
      throw new FlightError(
        "The supplier refresh could not be validated. Checkout was not started.",
      );
    }
    let claimed = false;
    const current = this.change(sessionId, journey.id, (latest) => {
      if (latest.attempt) return;
      if (
        latest.status !== "approved" ||
        !latest.offer ||
        !latest.approval ||
        offerApproval(latest.offer) !== offerApproval(journey.offer!) ||
        latest.approval.approvedAt !== journey.approval!.approvedAt
      )
        throw new FlightError(
          "Review and approve the current offer before checkout.",
        );
      if (
        refreshed.status === "unavailable" ||
        !this.usable(refreshed.offer, latest) ||
        !this.usable(latest.offer, latest)
      ) {
        latest.status = "unavailable";
        latest.approval = null;
        this.message(
          latest,
          "assistant",
          "This offer is unavailable, expired or already departed. Search again.",
        );
        return;
      }
      latest.offer = refreshed.offer;
      if (offerApproval(refreshed.offer) !== offerApproval(journey.offer!)) {
        latest.status = "review";
        latest.approval = null;
        this.message(
          latest,
          "assistant",
          "The itinerary, price or fare terms changed. Review the updated offer and approve it again.",
        );
        return;
      }
      latest.attempt = {
        id: randomUUID(),
        status: "verification_pending",
        startedAt: this.now().toISOString(),
        outcome: null,
      };
      latest.status = "verification_pending";
      this.message(latest, "assistant", pendingText);
      claimed = true;
    });
    if (!claimed) return current;
    let result: unknown;
    try {
      result = await supplier.checkout(
        structuredClone(current.offer!),
        current.attempt!.id,
      );
    } catch {
      result = null;
    }
    return this.recordOutcome(sessionId, current, result);
  }

  private recordOutcome(
    sessionId: string,
    original: FlightJourney,
    value: unknown,
  ): FlightJourney {
    const result = outcome(value, original.mode);
    return this.change(sessionId, original.id, (current) => {
      if (current.attempt?.id !== original.attempt!.id)
        throw new FlightError("This attempt no longer matches the journey.");
      if (current.attempt.status !== "verification_pending") return;
      current.attempt.status = result.status;
      current.attempt.outcome = {
        ...result,
        supplierReference:
          result.supplierReference ??
          current.attempt.outcome?.supplierReference,
        ticketReference:
          result.ticketReference ?? current.attempt.outcome?.ticketReference,
      };
      current.status = result.status;
      this.message(current, "assistant", result.message);
    });
  }

  private usable(offer: FlightOffer, journey: FlightJourney): boolean {
    return Boolean(lowestMatchingOffer(journey.request, [offer], this.now()));
  }

  private unavailable(sessionId: string, journeyId: string): FlightJourney {
    return this.change(sessionId, journeyId, (current) => {
      if (current.attempt) return;
      current.status = "unavailable";
      current.approval = null;
      this.message(
        current,
        "assistant",
        "This offer is unavailable, expired or already departed. Search again.",
      );
    });
  }

  private change(
    sessionId: string,
    journeyId: string,
    change: (journey: FlightJourney) => void,
  ): FlightJourney {
    return this.repository.update(sessionId, (current) => {
      this.requireJourney(current, journeyId);
      this.deliverReminder(current);
      change(current);
      current.updatedAt = this.now().toISOString();
      return current;
    })!;
  }

  private requireJourney(
    journey: FlightJourney | null,
    id: string,
  ): asserts journey is FlightJourney {
    if (!journey || journey.id !== id)
      throw new FlightError(
        "This journey does not belong to the current session.",
        404,
      );
  }

  private message(
    journey: FlightJourney,
    role: "user" | "assistant",
    text: string,
  ): void {
    const timestamp = this.now().toISOString();
    journey.messages.push({
      id: randomUUID(),
      role,
      text,
      createdAt: timestamp,
    });
    journey.updatedAt = timestamp;
  }

  private deliverReminder(journey: FlightJourney): void {
    const reminder = journey.reminder;
    if (
      !complete(journey) ||
      !reminder?.enabled ||
      reminder.deliveredAt ||
      Date.parse(reminder.dueAt) > this.now().getTime()
    )
      return;
    reminder.deliveredAt = this.now().toISOString();
    this.message(
      journey,
      "assistant",
      `Departure reminder: your flight leaves at ${journey.offer!.outbound[0].departureAt}. This uses your accepted ${reminder.leadMinutes}-minute airport-arrival fallback; it is not a leave-home calculation. In-app reminders appear when this app checks the server; no closed-app notification is sent.`,
    );
  }
}

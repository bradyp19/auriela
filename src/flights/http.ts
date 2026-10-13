import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { FlightError } from './errors';
import { flightActionSchema } from './validation';
import type { FlightAction, FlightJourney } from './types';

const cookieName = 'aurelia-flight-session';
const maxBodyBytes = 16_384;
interface JourneyService {
  get(sessionId: string): Promise<FlightJourney | null>;
  act(sessionId: string, action: FlightAction): Promise<FlightJourney>;
}

async function readAction(request: NextRequest): Promise<FlightAction> {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) throw new FlightError('Request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new FlightError('Send a flight action.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBodyBytes) {
      await reader.cancel();
      throw new FlightError('Request is too large.', 413);
    }
    chunks.push(value);
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new FlightError('Send valid JSON.', 400); }
  const parsed = flightActionSchema.safeParse(body);
  if (!parsed.success) throw new FlightError('Check the flight request and explicitly accept the displayed offer or reminder fallback.', 400);
  return parsed.data;
}

export function createFlightHandlers(service: JourneyService, sessionExists: (id: string) => boolean) {
  async function handle(request: NextRequest, mutate: boolean) {
    try {
      if (mutate && request.headers.get('origin') !== request.nextUrl.origin) throw new FlightError('Use this app to update your flight journey.', 403);
      if (mutate && request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new FlightError('Send JSON.', 415);
      const action = mutate ? await readAction(request) : null;
      const supplied = request.cookies.get(cookieName)?.value;
      const session = supplied && /^[0-9a-f-]{36}$/.test(supplied) && sessionExists(supplied) ? supplied : randomUUID();
      const journey = action ? await service.act(session, action) : await service.get(session);
      const response = NextResponse.json({ journey, mode: journey?.mode ?? 'fixture' }, { headers: { 'Cache-Control': 'private, no-store' } });
      response.cookies.set(cookieName, session, { httpOnly: true, sameSite: 'strict', secure: request.nextUrl.protocol === 'https:', path: '/', maxAge: 30 * 24 * 60 * 60 });
      return response;
    } catch (error) {
      return NextResponse.json({ error: error instanceof FlightError ? error.message : 'Flight service is temporarily unavailable. Refresh to recover your saved journey.' }, { status: error instanceof FlightError ? error.status : 503, headers: { 'Cache-Control': 'private, no-store' } });
    }
  }
  return {
    GET: (request: NextRequest) => handle(request, false),
    POST: (request: NextRequest) => handle(request, true),
  };
}

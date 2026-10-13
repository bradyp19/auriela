import { createFlightHandlers } from '@/flights/http';
import { flightServer } from '@/flights/server';

export const runtime = 'nodejs';
const handlers = createFlightHandlers({
  get: (session) => flightServer().service.get(session),
  act: (session, action) => flightServer().service.act(session, action),
}, (session) => flightServer().repository.load(session) !== null);

export const GET = handlers.GET;
export const POST = handlers.POST;

import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';

const http = await import('@/flights/http').catch(() => null);
const origin = 'http://localhost:3000';
function handlers() {
  expect(http, 'Flight HTTP boundary exists').not.toBeNull();
  return http!.createFlightHandlers({
    get: async () => null,
    act: async () => { throw new Error('secret-value must not escape'); },
  }, () => false);
}
function post(body: string, headers: Record<string, string> = {}) {
  return new NextRequest(`${origin}/api/flights`, {
    method: 'POST', body,
    headers: { origin, 'content-type': 'application/json', ...headers },
  });
}
describe('flight HTTP trust boundary', () => {
  it('issues a private no-store session cookie rather than trusting a forged cookie', async () => {
    const forged = randomUUID();
    const response = await handlers().GET(new NextRequest(`${origin}/api/flights`, { headers: { cookie: `aurelia-flight-session=${forged}` } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ journey: null, mode: 'fixture' });
    expect(response.headers.get('cache-control')).toContain('no-store');
    const cookie = response.headers.get('set-cookie')!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=strict');
    expect(cookie).not.toContain(forged);
  });
  it('uses secure cookies for HTTPS and reuses a known session', async () => {
    expect(http).not.toBeNull();
    const known = randomUUID();
    const seen: string[] = [];
    const routes = http!.createFlightHandlers({ get: async (session) => { seen.push(session); return null; }, act: async () => { throw Error('unused'); } }, (session) => session === known);
    const response = await routes.GET(new NextRequest('https://localhost/api/flights', { headers: { cookie: `aurelia-flight-session=${known}` } }));
    expect(seen).toEqual([known]);
    expect(response.headers.get('set-cookie')).toContain('Secure');
  });
  it('rejects cross-origin and missing-origin mutations', async () => {
    expect((await handlers().POST(post('{}', { origin: 'https://evil.example' }))).status).toBe(403);
    const request = post('{}');
    request.headers.delete('origin');
    expect((await handlers().POST(request)).status).toBe(403);
  });
  it('rejects malformed JSON, wrong media types and oversized bodies', async () => {
    expect((await handlers().POST(post('{bad'))).status).toBe(400);
    expect((await handlers().POST(post('{}', { 'content-type': 'text/plain' }))).status).toBe(415);
    expect((await handlers().POST(post(' '.repeat(17000)))).status).toBe(413);
  });
  it('rejects forged prices, status, session identifiers and nonexplicit approval', async () => {
    for (const action of [
      { type: 'checkout', journeyId: 'j', total: 1 },
      { type: 'verify', journeyId: 'j', status: 'verified_complete' },
      { type: 'verify', journeyId: 'j', sessionId: 'victim' },
      { type: 'approve', journeyId: 'j', offerId: 'o', accepted: false },
    ]) expect((await handlers().POST(post(JSON.stringify(action)))).status).toBe(400);
  });
  it('redacts unexpected server failures and returns a retryable error', async () => {
    const response = await handlers().POST(post(JSON.stringify({ type: 'verify', journeyId: 'j' })));
    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toBeTruthy();
    expect(JSON.stringify(data)).not.toContain('secret-value');
  });
});

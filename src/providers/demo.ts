import { inventory } from '@/data/inventory';
import { MEMBERSHIP } from '@/domain/config';
import { addDays, daysBetween, validRange } from '@/domain/dates';
import type { Booking, Inventory, Quote, SearchCriteria } from '@/domain/types';
import type { AssistantProvider, BookingProvider, InventoryProvider, MembershipProvider, QuoteProvider } from './contracts';

export function assertCriteria(c: SearchCriteria) {
  if (!validRange(c.start,c.end)) throw new Error('Choose a valid date range of 1–30 nights.');
  if (!Number.isInteger(c.travelers) || c.travelers<1 || c.travelers>8 || !Number.isInteger(c.rooms) || c.rooms<1 || c.rooms>4) throw new Error('Choose 1–8 travelers and 1–4 rooms.');
  if (c.category==='flight' && (c.start < '2026-11-01' || c.end > '2026-11-30')) throw new Error('Demo flight schedules cover November 1–30, 2026. Choose dates within that month.');
}
export const demoInventory: InventoryProvider = {
  async search(c, scenario='normal') {
    assertCriteria(c);
    if (scenario==='failure') throw new Error('The demo inventory search failed. Retry to search again.');
    if (scenario==='unavailable') return [];
    const results = inventory.filter(i => i.category===c.category && i.destination.toLowerCase()===c.destination.trim().toLowerCase() && i.price<=c.maxPrice && (!c.refundable || ('refundable' in i && i.refundable)) && (i.category!=='flight' || (i.origin===c.origin.toUpperCase().trim() && (!c.nonstop || i.stops===0))) && (i.category!=='activity' || !c.activityType || i.activityType===c.activityType) && (i.category!=='hotel' || i.rooms.some(r=>r.capacity*c.rooms>=c.travelers)));
    return results.sort((a,b)=>c.sort==='price-asc'?a.price-b.price:c.sort==='price-desc'?b.price-a.price:b.rating-a.rating);
  }
};
export function createQuote(item: Inventory, c: SearchCriteria, offer: 'public'|'pro'='public', roomId?: string, extra=0, now=new Date()): Quote {
  assertCriteria(c);
  if (item.category !== c.category || item.destination.toLowerCase() !== c.destination.trim().toLowerCase()) throw new Error('This saved item belongs to a different destination or search category. Search again for your current trip.');
  let base: number; let label: string;
  if (item.category==='hotel') {
    const room=item.rooms.find(r=>r.id===(roomId||item.rooms[0].id));
    if (!room || room.capacity*c.rooms<c.travelers) throw new Error('This room selection cannot accommodate all travelers. Add rooms or select a larger room.');
    base=(item.price+room.supplement)*daysBetween(c.start,c.end)*c.rooms;
    label=`${daysBetween(c.start,c.end)} nights × ${c.rooms} room${c.rooms>1?'s':''}`;
    roomId=room.id;
  } else { base=item.price*c.travelers*(item.category==='flight'&&c.returnFlight?2:1); label=`${c.travelers} ${item.category==='flight'?'passenger':'participant'}${c.travelers>1?'s':''}${item.category==='flight'?(c.returnFlight?' · return':' · one-way'):''}`; }
  const discount=item.category==='hotel'&&offer==='pro'?Math.round(base*MEMBERSHIP.hotelDiscountPercent/100):0;
  const tax=item.category==='hotel'?Math.round((base-discount)*0.1):0;
  const fees=item.category==='hotel'?1800*c.rooms:0;
  const breakdown=[{label,amount:base}, ...(discount?[{label:'Eligible Pro offer',amount:-discount}]:[]),{label:item.category==='hotel'?'Taxes (10%)':'Taxes included',amount:tax},{label:item.category==='hotel'?'Mandatory property fee':'Mandatory fees included',amount:fees}, ...(extra?[{label:'Demo price refresh adjustment',amount:extra}]:[])];
  const refundable='refundable' in item && item.refundable;
  const total=breakdown.reduce((sum,row)=>sum+row.amount,0);
  return {id:crypto.randomUUID(),inventoryId:item.id,roomId,currency:'USD',demo:true,breakdown,total,publicTotal:base+Math.round(item.category==='hotel'?base*0.1:0)+fees+extra,retrievedAt:now.toISOString(),expiresAt:new Date(now.getTime()+15*60000).toISOString(),criteria:{...c},offer,cancellation:{refundable,deadline:`${addDays(c.start,-2)}T23:59:00Z`,penalty:refundable?0:total}};
}
export const demoQuotes: QuoteProvider = { async refresh(item,c,offer,roomId,scenario='normal') {
  if(!item.available||scenario==='unavailable') throw new Error('This demo room is no longer available. Choose another room or hotel.');
  return createQuote(item,c,offer,roomId,scenario==='price-change'?3500:0);
}};
const submitted=new Map<string,Booking>();
export const demoBookings: BookingProvider = {
  async book(quote,tripId,traveler,key,scenario='normal') {
    if(submitted.has(key)) return submitted.get(key)!;
    if(Date.parse(quote.expiresAt)<=Date.now()) throw new Error('Your quote expired. Refresh the price before confirming.');
    if(scenario==='failure') throw new Error('Simulated supplier failure. No reservation or charge was made. You can retry.');
    if(scenario==='unavailable') throw new Error('This demo room is unavailable. No charge was made.');
    const booking:Booking={id:`DEMO-${crypto.randomUUID().slice(0,8).toUpperCase()}`,tripId,quote,traveler,idempotencyKey:key,supplierState:'confirmed',paymentState:'not-charged',demo:true,createdAt:new Date().toISOString()};
    submitted.set(key,booking);return booking;
  },
  async cancel(booking) { if(booking.supplierState==='cancelled') return booking; const penalty=booking.quote.cancellation.refundable&&Date.now()<=Date.parse(booking.quote.cancellation.deadline)?0:booking.quote.total; return {...booking,supplierState:'cancelled',cancelledAt:new Date().toISOString(),cancellationPenalty:penalty}; }
};
export const demoMembership: MembershipProvider = { async preview(tier) { return {tier,demo:true}; }};
export const demoAssistant: AssistantProvider = { async respond(message,trip) {
  const text=message.trim().toLowerCase();
  const dates=text.match(/(\d{4}-\d{2}-\d{2})\s+(?:to|through|–)\s+(\d{4}-\d{2}-\d{2})/);
  if(dates) return validRange(dates[1],dates[2])?{message:'Dates updated. Saved prices need review; refresh them before booking.',action:{type:'dates',start:dates[1],end:dates[2]}}:{message:'Choose a valid range of 1–30 nights with the calendar.',action:{type:'none'}};
  const budget=text.match(/budget\s*(?:to|of|is)?\s*\$?([\d,]+)(?:\.(\d{1,2}))?/);
  if(budget) {const amount=Math.round(Number(budget[1].replaceAll(',','')+'.'+(budget[2]||'0'))*100); if(amount>0&&amount<=100000000) return {message:'Your trip budget has been updated.',action:{type:'budget',amount}};}
  if(text.startsWith('add ')) { const activity=inventory.find(i=>i.category==='activity'&&i.destination===trip.destination&&text.includes(i.name.toLowerCase())); if(activity) return {message:`Added ${activity.name} to your trip plan using the current demo price.`,action:{type:'add',inventoryId:activity.id}}; }
  const category=text.includes('flight')?'flight':text.includes('activit')?'activity':text.includes('hotel')?'hotel':null;
  if(category && /search|find|show/.test(text)) return {message:`Searching ${trip.destination} ${category==='activity'?'activities':category+'s'} in the demo inventory. Use destination controls before searching a different city.`,action:{type:'search',category}};
  const destination=['Lisbon','Kyoto'].find(d=>text.includes(d.toLowerCase()));
  if(destination && /go|destination|visit|plan|set|trip/.test(text)) return {message:`Your trip destination is now ${destination}. Previous selections are flagged for review.`,action:{type:'destination',destination}};
  return {message:'I can set a destination (Lisbon or Kyoto), change a budget, set dates as YYYY-MM-DD to YYYY-MM-DD, search hotels, flights or activities, and add a named activity. For anything else, use the search and trip controls. This assistant uses local rules, not a connected AI service.',action:{type:'none'}};
}};

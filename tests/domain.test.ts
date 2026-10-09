import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inventory } from '@/data/inventory';
import { addDays, daysBetween, validDate, validRange } from '@/domain/dates';
import { createQuote, demoAssistant, demoBookings, demoInventory, demoQuotes } from '@/providers/demo';
import { appSchema, decodeData, defaultCriteria, initialData, newTrip } from '@/providers/storage';
import { changeContext, saveItem, selectedTotal } from '@/application/trips';
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));});
afterEach(()=>vi.useRealTimers());
const hotel=inventory.find(i=>i.id==='h-lis-1')!;
const criteria=defaultCriteria(newTrip());
const traveler={firstName:'Demo',lastName:'Traveler',email:'demo@example.com'};
describe('calendar dates',()=>{
 it('does not shift dates across DST or accept impossible dates',()=>{expect(daysBetween('2026-10-31','2026-11-02')).toBe(2);expect(addDays('2026-10-31',2)).toBe('2026-11-02');expect(validDate('2026-02-30')).toBe(false);expect(validRange('2026-11-16','2026-11-12')).toBe(false);expect(validRange('2026-11-12','2026-12-20')).toBe(false);});
});
describe('inventory and quote arithmetic',()=>{
 it('calculates rooms, nights, taxes, mandatory fees and Pro separately',()=>{const quote=createQuote(hotel,criteria);expect(quote.total).toBe(109600);expect(quote.breakdown.reduce((s,r)=>s+r.amount,0)).toBe(quote.total);const pro=createQuote(hotel,criteria,'pro');expect(pro.total).toBe(93430);expect(pro.publicTotal-pro.total-5000).toBe(11170);expect(Number.isInteger(pro.total)).toBe(true);});
 it('rejects excess occupancy and respects larger room pricing',()=>{expect(()=>createQuote(hotel,{...criteria,travelers:3})).toThrow(/accommodate/);expect(createQuote(hotel,{...criteria,travelers:3},'public','suite').total).toBe(147000);});
 it('filters, sorts and returns no invented destination inventory',async()=>{expect(await demoInventory.search({...criteria,destination:'Mars'})).toEqual([]);const results=await demoInventory.search({...criteria,refundable:true,sort:'price-asc',maxPrice:25000});expect(results.map(i=>i.id)).toEqual(['h-lis-2','h-lis-4','h-lis-1']);expect(await demoInventory.search({...criteria,category:'flight',origin:'LAX'})).toEqual([]);await expect(demoInventory.search(criteria,'failure')).rejects.toThrow(/failed/);});
 it('refreshes changed prices and rejects unavailable rooms',async()=>{const normal=await demoQuotes.refresh(hotel,criteria,'public');const changed=await demoQuotes.refresh(hotel,criteria,'public',undefined,'price-change');expect(changed.total-normal.total).toBe(3500);await expect(demoQuotes.refresh(hotel,criteria,'public',undefined,'unavailable')).rejects.toThrow(/available/);});
});
describe('booking lifecycle',()=>{
 it('deduplicates rapid submissions and never records a payment',async()=>{const q=createQuote(hotel,criteria);const key=crypto.randomUUID();const [a,b]=await Promise.all([demoBookings.book(q,'trip',traveler,key),demoBookings.book(q,'trip',traveler,key)]);expect(a.id).toBe(b.id);expect(a.paymentState).toBe('not-charged');const cancelled=await demoBookings.cancel(a);expect(cancelled.supplierState).toBe('cancelled');expect(cancelled.cancellationPenalty).toBe(0);expect((await demoBookings.cancel(cancelled)).cancelledAt).toBe(cancelled.cancelledAt);});
 it('rejects expired quotes and allows a retry after a failure',async()=>{const q=createQuote(hotel,criteria);await expect(demoBookings.book({...q,expiresAt:'2020-01-01T00:00:00Z'},'trip',traveler,'expired')).rejects.toThrow(/expired/);const key=crypto.randomUUID();await expect(demoBookings.book(q,'trip',traveler,key,'failure')).rejects.toThrow(/failure/);expect((await demoBookings.book(q,'trip',traveler,key)).supplierState).toBe('confirmed');});
 it('uses the displayed nonrefundable penalty',async()=>{const q=createQuote(inventory.find(i=>i.id==='h-lis-3')!,criteria);const b=await demoBookings.book(q,'trip',traveler,crypto.randomUUID());expect((await demoBookings.cancel(b)).cancellationPenalty).toBe(q.total);});
});
describe('saved trips and persistence',()=>{
 it('excludes alternatives and flags snapshots after context changes',()=>{const t=saveItem(newTrip(),hotel,createQuote(hotel,criteria));expect(selectedTotal(t)).toBe(0);const s=saveItem(t,hotel,createQuote(hotel,criteria),'selected');expect(selectedTotal(s)).toBe(109600);expect(s.items).toHaveLength(1);expect(s.itinerary).toHaveLength(1);expect(changeContext(s,{start:'2026-11-13'}).items[0].needsReview).toBe(true);});
 it('roundtrips and recovers malformed or structurally invalid local data',()=>{const data=initialData();expect(decodeData(JSON.stringify(data)).data).toEqual(data);expect(decodeData('{invalid').warning).toBeTruthy();expect(decodeData(JSON.stringify({...data,trips:[{}]})).warning).toBeTruthy();expect(appSchema.safeParse({...data,membership:{tier:'pro',demo:false}}).success).toBe(false);});
 it('keeps the bounded assistant honest and uses supported actions',async()=>{expect((await demoAssistant.respond('Set budget $2,500',newTrip())).action).toEqual({type:'budget',amount:250000});expect((await demoAssistant.respond('Set dates 2026-02-30 to 2026-03-05',newTrip())).action.type).toBe('none');expect((await demoAssistant.respond('Book me a private jet',newTrip())).message).toContain('not a connected AI');});
});

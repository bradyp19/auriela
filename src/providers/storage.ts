import { z } from 'zod';
import { DEMO_END, DEMO_START, STORAGE_KEY } from '@/domain/config';
import { validDate, validRange } from '@/domain/dates';
import type { AppData, SearchCriteria, Trip } from '@/domain/types';
import type { TripStorage } from './contracts';

const date = z.string().refine(validDate);
const cents = z.number().int().nonnegative().max(1000000000);
const category = z.enum(['hotel','flight','activity']);
const criteria = z.object({category,destination:z.string(),origin:z.string(),start:date,end:date,travelers:z.number().int().min(1).max(8),rooms:z.number().int().min(1).max(4),returnFlight:z.boolean(),maxPrice:cents,refundable:z.boolean(),nonstop:z.boolean(),activityType:z.string(),sort:z.enum(['recommended','price-asc','price-desc','rating'])}).refine(c=>validRange(c.start,c.end));
const quote = z.object({id:z.string(),inventoryId:z.string(),roomId:z.string().optional(),currency:z.literal('USD'),demo:z.literal(true),breakdown:z.array(z.object({label:z.string(),amount:z.number().int()})),total:cents,publicTotal:cents,retrievedAt:z.iso.datetime(),expiresAt:z.iso.datetime(),criteria,offer:z.enum(['public','pro']),cancellation:z.object({refundable:z.boolean(),deadline:z.iso.datetime(),penalty:cents})}).refine(q=>q.total===q.breakdown.reduce((a,b)=>a+b.amount,0));
const trip = z.object({id:z.string(),name:z.string().min(1).max(120),destination:z.string(),start:date,end:date,budget:cents,searches:z.array(criteria),items:z.array(z.object({id:z.string(),inventoryId:z.string(),category,status:z.enum(['shortlisted','selected']),snapshot:quote,needsReview:z.boolean()})),itinerary:z.array(z.object({id:z.string(),itemId:z.string().optional(),day:date,title:z.string(),note:z.string()})),notes:z.string(),bookingIds:z.array(z.string())}).refine(t=>validRange(t.start,t.end));
const booking = z.object({id:z.string(),tripId:z.string(),quote,traveler:z.object({firstName:z.string(),lastName:z.string(),email:z.string()}),supplierState:z.enum(['confirmed','cancelled']),paymentState:z.literal('not-charged'),demo:z.literal(true),createdAt:z.iso.datetime(),cancelledAt:z.iso.datetime().optional(),cancellationPenalty:cents.optional(),idempotencyKey:z.string()});
export const appSchema = z.object({version:z.literal(1),trips:z.array(trip).min(1),activeTripId:z.string(),favorites:z.array(z.string()),bookings:z.array(booking),membership:z.object({tier:z.enum(['public','pro']),demo:z.literal(true)})});
export function newTrip(name='A little Lisbon',destination='Lisbon',start=DEMO_START,end=DEMO_END):Trip { return {id:crypto.randomUUID(),name,destination,start,end,budget:250000,searches:[],items:[],itinerary:[],notes:'',bookingIds:[]}; }
export function initialData():AppData { const trip=newTrip();return {version:1,trips:[trip],activeTripId:trip.id,favorites:[],bookings:[],membership:{tier:'public',demo:true}}; }
export function defaultCriteria(t:Trip):SearchCriteria { return {category:'hotel',destination:t.destination,origin:'JFK',start:t.start,end:t.end,travelers:2,rooms:1,returnFlight:true,maxPrice:200000,refundable:false,nonstop:false,activityType:'',sort:'recommended'}; }
export function decodeData(raw:string|null):{data:AppData;warning?:string} {
  if(!raw) return {data:initialData()};
  try { const data=appSchema.parse(JSON.parse(raw)); if(!data.trips.some(t=>t.id===data.activeTripId)) data.activeTripId=data.trips[0].id; return {data}; }
  catch { return {data:initialData(),warning:'Saved demo data could not be read. A fresh workspace has been opened.'}; }
}
export const localTripStorage:TripStorage={
  load(){try{return decodeData(localStorage.getItem(STORAGE_KEY));}catch{return {data:initialData(),warning:'Browser storage is unavailable. Changes will last for this session only.'};}},
  save(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));},
  reset(){localStorage.removeItem(STORAGE_KEY);return initialData();}
};

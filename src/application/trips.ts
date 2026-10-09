import type { Inventory, Quote, Trip } from '@/domain/types';
export function saveItem(trip:Trip,item:Inventory,quote:Quote,status:'shortlisted'|'selected'='shortlisted'):Trip {
  const existing=trip.items.find(i=>i.inventoryId===item.id);
  const tripItem={id:existing?.id||crypto.randomUUID(),inventoryId:item.id,category:item.category,status:existing?.status==='selected'?'selected' as const:status,snapshot:quote,needsReview:false};
  const items=existing?trip.items.map(i=>i.id===existing.id?tripItem:i):[...trip.items,tripItem];
  const itinerary=status==='selected'&&!trip.itinerary.some(e=>e.itemId===tripItem.id)?[...trip.itinerary,{id:crypto.randomUUID(),itemId:tripItem.id,day:trip.start,title:item.name,note:''}]:trip.itinerary;
  return {...trip,items,itinerary};
}
export function changeContext(trip:Trip,patch:Partial<Pick<Trip,'start'|'end'|'destination'>>):Trip {
  const changed=Object.entries(patch).some(([key,value])=>trip[key as keyof typeof patch]!==value);
  return {...trip,...patch,items:changed?trip.items.map(i=>({...i,needsReview:true})):trip.items};
}
export const selectedTotal=(trip:Trip)=>trip.items.filter(i=>i.status==='selected').reduce((sum,i)=>sum+i.snapshot.total,0);

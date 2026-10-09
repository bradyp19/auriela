'use client';
import { useRef, useState } from 'react';
import { getInventory } from '@/data/inventory';
import { updateData } from '@/application/store';
import { demoBookings } from '@/providers/demo';
import { dateRange } from '@/domain/dates';
import { money } from '@/domain/money';
import type { Booking } from '@/domain/types';
import { Empty, Modal, SectionHeading } from './ui';
import { CancellationTerms, PriceBreakdown } from './details';
export function BookingsView({bookings}:{bookings:Booking[]}){
 const [selected,setSelected]=useState<string|null>(null);const [cancel,setCancel]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);const booking=bookings.find(b=>b.id===selected);
 async function cancelBooking(){if(!booking||lock.current)return;lock.current=true;setBusy(true);try{const result=await demoBookings.cancel(booking);updateData(d=>({...d,bookings:d.bookings.map(b=>b.id===result.id?result:b)}));setCancel(false);}catch(e){setError((e as Error).message);}finally{lock.current=false;setBusy(false);}}
 return <><SectionHeading eyebrow="ALL THE DETAILS, TOGETHER" title="Your bookings"/><p className="page-subtitle">Simulated stays, saved here. No real reservations or payments.</p>{bookings.length===0?<Empty title="The next stay is yours to find">Choose a hotel in Search and complete the demo checkout. Your confirmation and cancellation options will appear here.</Empty>:<div className="booking-list">{[...bookings].reverse().map(b=><article key={b.id}><div className="booking-id">{b.id}<span>{b.supplierState==='confirmed'?'Demo confirmed':'Demo cancelled'}</span></div><h2>{getInventory(b.quote.inventoryId)?.name||'Saved hotel'}</h2><p>{dateRange(b.quote.criteria.start,b.quote.criteria.end)} · {b.quote.criteria.travelers} guests · {b.quote.criteria.rooms} room(s)</p><div className="booking-bottom"><span>{money(b.quote.total)} <small>· No payment collected</small></span><button className="button" onClick={()=>{setSelected(b.id);setCancel(false);setError('');}}>Booking details</button></div></article>)}</div>}
 {booking&&<Modal title={cancel?'Cancel this demo booking?':'Booking details'} description={`${booking.id} · ${booking.supplierState} · payment: not charged`} open onClose={()=>setSelected(null)}><h3>{getInventory(booking.quote.inventoryId)?.name}</h3><p>{dateRange(booking.quote.criteria.start,booking.quote.criteria.end)} · {booking.traveler.firstName} {booking.traveler.lastName}</p><PriceBreakdown quote={booking.quote}/><CancellationTerms quote={booking.quote}/>{booking.supplierState==='cancelled'?<p className="notice">Cancelled locally. Simulated penalty: {money(booking.cancellationPenalty||0)}. No real refund was issued because no payment was collected.</p>:cancel?<><p className="notice">The local record will be marked cancelled. No supplier will be contacted and no real refund will be issued.</p><div className="button-row"><button className="button" onClick={()=>setCancel(false)}>Keep booking</button><button className="button primary" disabled={busy} onClick={()=>void cancelBooking()}>Confirm demo cancellation</button></div></>:<button className="button" onClick={()=>setCancel(true)}>Cancel demo booking</button>}{error&&<p role="alert">{error}</p>}</Modal>}
 </>;
}

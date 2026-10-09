'use client';
import { getInventory } from '@/data/inventory';
import { createQuote } from '@/providers/demo';
import { money } from '@/domain/money';
import type { SearchCriteria } from '@/domain/types';
import { Modal } from './ui';
export function Compare({ids,criteria,onClose,onDetails}:{ids:string[];criteria:SearchCriteria;onClose:()=>void;onDetails:(id:string)=>void}){
 const items=ids.map(getInventory).filter(i=>!!i);
 return <Modal title="A closer comparison" description="Compare alternatives within one category. Shortlists are excluded from your selected trip total." open onClose={onClose} wide><div className="comparison-scroll"><table className="comparison-table"><thead><tr><th>YOUR OPTIONS</th>{items.map(i=><th key={i.id}>{i.name}</th>)}</tr></thead><tbody><tr><th>Rate</th>{items.map(i=><td key={i.id}>{money(i.price)} / {i.category==='hotel'?'night, room':'person'}</td>)}</tr><tr><th>Full demo total</th>{items.map(i=>{let value='Choose room';try{value=money(createQuote(i,criteria).total);}catch{}return <td key={i.id}>{value}</td>;})}</tr><tr><th>Rating</th>{items.map(i=><td key={i.id}>{i.rating}</td>)}</tr><tr><th>What to know</th>{items.map(i=><td key={i.id}>{i.category==='hotel'?i.amenities.join(' · '):i.category==='flight'?`${i.duration} minutes · ${i.stops} stops · ${i.baggage}`:`${i.duration} minutes · ${i.meeting}`}</td>)}</tr><tr><th>Cancellation</th>{items.map(i=><td key={i.id}>{'refundable'in i?(i.refundable?'Free until 2 days before; then full penalty':'Non-refundable'):'Planning only; supplier terms required'}</td>)}</tr><tr><th>Next step</th>{items.map(i=><td key={i.id}><button className="button small" onClick={()=>onDetails(i.id)}>View details</button></td>)}</tr></tbody></table></div></Modal>;
}

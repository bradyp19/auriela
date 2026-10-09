'use client';
import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker, type DateRange } from 'react-day-picker';
import { CalendarDays, X } from 'lucide-react';
import { calendarDate, dateRange, localDate, validRange } from '@/domain/dates';
export function DatePicker({start,end,onChange,compact=false}:{start:string;end:string;onChange:(start:string,end:string)=>void;compact?:boolean}){
 const [open,setOpen]=useState(false);const [range,setRange]=useState<DateRange|undefined>();
 const trigger=<button type="button" className={compact?'calendar-button':'date-trigger'} aria-label="Choose travel dates"><CalendarDays size={18}/>{!compact&&<span>{dateRange(start,end)}</span>}</button>;
 const from=range?.from?localDate(range.from):'';const to=range?.to?localDate(range.to):'';
 return <Popover.Root open={open} onOpenChange={v=>{setOpen(v);if(v)setRange(start&&end?{from:calendarDate(start),to:calendarDate(end)}:undefined);}}><Popover.Trigger asChild>{trigger}</Popover.Trigger><Popover.Portal><Popover.Content className="date-popover" sideOffset={12} collisionPadding={12} aria-label="Travel dates"><div className="popover-title"><strong>When are we going?</strong><Popover.Close className="icon-button" aria-label="Close calendar"><X size={18}/></Popover.Close></div><p>Select departure and return. Up to 30 nights.</p><DayPicker mode="range" selected={range} onSelect={setRange} defaultMonth={start?calendarDate(start):new Date()} min={1} max={30} disabled={{before:new Date(new Date().setHours(0,0,0,0))}} autoFocus/><div className="date-summary">{from?dateRange(from,to):'Select your dates'}</div><div className="button-row"><button className="button ghost" onClick={()=>{onChange('','');setRange(undefined);setOpen(false);}}>Clear dates</button><button className="button primary" disabled={!validRange(from,to)} onClick={()=>{onChange(from,to);setOpen(false);}}>Apply dates</button></div></Popover.Content></Popover.Portal></Popover.Root>;
}

'use client';
import { useRef, useState } from 'react';
import { ArrowUp, Sparkles, X } from 'lucide-react';
import { demoAssistant } from '@/providers/demo';
import type { AssistantResponse, Trip } from '@/domain/types';
import { dateRange } from '@/domain/dates';
import { DatePicker } from './date-picker';
import { Metal, StatusOrb } from './effects';
export function Composer({trip,onAction,onDates}:{trip:Trip;onAction:(reply:AssistantResponse)=>Promise<void>;onDates:(start:string,end:string)=>void}){
 const [message,setMessage]=useState('');const [messages,setMessages]=useState<{role:string;text:string}[]>([]);const [busy,setBusy]=useState(false);const [expanded,setExpanded]=useState(false);const lock=useRef(false);
 async function send(text=message){if(!text.trim()||lock.current)return;lock.current=true;setBusy(true);setExpanded(true);setMessage('');setMessages(m=>[...m,{role:'You',text}]);try{const reply=await demoAssistant.respond(text,trip);await onAction(reply);setMessages(m=>[...m,{role:'auriela',text:reply.message}]);}catch(e){setMessages(m=>[...m,{role:'auriela',text:`This demo request could not be completed. ${(e as Error).message}`}]);}finally{lock.current=false;setBusy(false);}}
 return <div className="composer-dock">{expanded&&<div className="conversation"><div className="conversation-header"><span><Sparkles size={16}/>Your travel assistant <small>· local demo</small></span><button className="icon-button" aria-label="Collapse assistant messages" onClick={()=>setExpanded(false)}><X size={17}/></button></div><div className="messages" aria-live="polite">{messages.slice(-4).map((m,i)=><div key={i} className={m.role==='You'?'user-message':'assistant-message'}><strong>{m.role}</strong><p>{m.text}</p></div>)}{busy&&<StatusOrb state="solving" label="Thinking…"/>}</div></div>}
 <Metal className="composer-metal" dark><form className="composer" onSubmit={e=>{e.preventDefault();void send();}}><label className="sr-only" htmlFor="assistant-message">Message auriela</label><textarea id="assistant-message" placeholder="Your next chapter starts with a thought…" value={message} onChange={e=>setMessage(e.target.value)} maxLength={1000} rows={1} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send();}}}/><div className="composer-bottom"><div className="composer-context"><DatePicker start={trip.start} end={trip.end} compact onChange={onDates}/><span>{trip.destination}<span className="context-divider">/</span>{dateRange(trip.start,trip.end)}</span></div><Metal circle dark><button className="send-button" type="submit" aria-label="Send message" disabled={busy||!message.trim()}><ArrowUp size={20}/></button></Metal></div></form></Metal>
 <div className="composer-caption"><span>Ask auriela. Make it your own.</span><button onClick={()=>void send('What can you do?')}>Demo assistant · what can I ask?</button></div>
 </div>;
}

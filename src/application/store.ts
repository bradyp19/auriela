'use client';
import { useSyncExternalStore } from 'react';
import { localTripStorage } from '@/providers/storage';
import type { AppData, Trip } from '@/domain/types';
type State={data:AppData|null;warning:string};
let state:State={data:null,warning:''};
const serverState:State=state;
const listeners=new Set<()=>void>();
function emit(){listeners.forEach(listener=>listener());}
export function initializeStore(){if(state.data)return;const {data,warning}=localTripStorage.load();state={data,warning:warning||''};emit();}
export function updateData(fn:(data:AppData)=>AppData){if(!state.data)return;const data=fn(state.data);let warning=state.warning;try{localTripStorage.save(data);}catch{warning='Changes could not be saved to this browser. Keep this tab open or free up storage.';}state={data,warning};emit();}
export function updateTrip(id:string,fn:(trip:Trip)=>Trip){updateData(data=>({...data,trips:data.trips.map(t=>t.id===id?fn(t):t)}));}
export function resetStore(){try{state={data:localTripStorage.reset(),warning:''};}catch{state={...state,warning:'Reset failed because browser storage is unavailable.'};}emit();}
export function useWorkspace(){return useSyncExternalStore((listener)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},()=>state,()=>serverState);}

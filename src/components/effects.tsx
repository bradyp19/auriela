'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { MetalFx, MetalText, pauseShared, resumeShared } from 'metal-fx';
import { ThinkingOrb, type OrbState } from 'thinking-orbs';
function usePause(){
  const [paused,setPaused]=useState(true);
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setPaused(media.matches||document.hidden);update();media.addEventListener('change',update);document.addEventListener('visibilitychange',update);return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};},[]);
  return paused;
}
export function EffectLifecycle(){const paused=usePause();useEffect(()=>{if(paused)pauseShared();else resumeShared();},[paused]);return null;}
export function Metal({children,circle=false,className='',dark=false}:{children:ReactNode;circle?:boolean;className?:string;dark?:boolean}) {const paused=usePause();return <MetalFx className={className} preset="silver" variant={circle?'circle':'button'} strength={0.38} disableGlow paused={paused} theme={dark?'dark':'light'} normalizeHostStyles={false}>{children}</MetalFx>;}
export function ProText(){const paused=usePause();return paused?<span>Pro</span>:<MetalText font={'500 32px/1.2 "DM Sans Variable", sans-serif'} color="#343434" theme="light" strength={0.25}>Pro</MetalText>;}
export function StatusOrb({state,label,size=20}:{state:OrbState;label:string;size?:20|64}) {return <span className="orb-status" role="status"><ThinkingOrb state={state} size={size} theme="light" aria-hidden="true"/>{label}</span>;}

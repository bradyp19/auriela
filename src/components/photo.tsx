'use client';
import Image from 'next/image';
import { useState } from 'react';
export function Photo({src,alt,priority=false}:{src:string;alt:string;priority?:boolean}) {
  const [failed,setFailed]=useState(false);
  return failed?<div className="photo-fallback" role="img" aria-label={alt}>Photograph unavailable</div>:<Image src={src} alt={alt} width={1400} height={950} unoptimized loading={priority?'eager':'lazy'} onError={()=>setFailed(true)}/>;
}

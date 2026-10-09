'use client';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
const Globe = dynamic(()=>import('./originkit/ui/globe'),{ssr:false,loading:()=> <Image src="/globe-static.svg" alt="A globe of Earth" width={480} height={480} unoptimized/>});
const dots={color:'#e2e2e2',size:2.2,density:8,allDots:false};
const markers={markers:[],color:'#ffffff',size:0};
export function Hero(){return <main className="hero"><div className="hero-composition"><h1 className="hero-title"><span className="intro-name" aria-hidden="true">Auriela</span><span className="intro-tagline">the future of your travel</span></h1><div className="hero-globe" role="img" aria-label="Slowly rotating globe of Earth"><Globe speed={0.55} scale={8.8} dots={dots} markerConfig={markers} oceanColor="#000000" showOutline={false} showGrid={true} graticuleColor="#424242" initialLatitude={23} initialLongitude={-23} detail={4}/></div><Link href="/app" className="hero-cta">Try now <ArrowUpRight size={18}/></Link></div></main>;}

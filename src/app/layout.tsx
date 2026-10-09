import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import 'react-day-picker/style.css';
import './globals.css';
export const metadata: Metadata = { title:'auriela — the future of your travel', description:'A considered way to search, plan, and keep your travels together. Phase One demo.', icons:{icon:'/icon.svg'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}

import { Suspense } from 'react';
import { Workspace } from '@/components/workspace';
export default function AppPage(){return <Suspense fallback={<div className="workspace-loading">Opening auriela…</div>}><Workspace/></Suspense>;}

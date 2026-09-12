import { v as X } from './auth-CFRsUa-j.js';
import { p } from './reportEvents-Ce-jVB2J.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const m=async({request:o})=>{const n=await X(o);if(!n.success||!n.user)return new Response("Unauthorized",{status:401});const t=`report-${n.user.id}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;let e=null;const c=new ReadableStream({start(r){const s=new TextEncoder;p.addClient(t,r),r.enqueue(s.encode(`data: ${JSON.stringify({type:"connected",clientId:t})}

`)),e=setInterval(()=>{try{r.enqueue(s.encode(`: heartbeat

`));}catch{e&&clearInterval(e),p.removeClient(t);}},3e4);},cancel(){e&&clearInterval(e),p.removeClient(t);}});return new Response(c,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive","X-Accel-Buffering":"no"}})};

export { m as GET };
//# sourceMappingURL=_server.ts-9c9jcP0J.js.map

import { a as C, s as G } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const f=async({cookies:i})=>{const r=i.get("session_token");if(!r)return new Response("Unauthorized",{status:401});const t=await C(r);if(!t.success||!t.user)return new Response("Invalid session",{status:401});const o=t.user.id,n=`${o}-${Date.now()}-${Math.random().toString(36).substr(2,9)}`;let e=null;const u=new ReadableStream({start(s){const c=new TextEncoder;G.addClient(n,o,s),s.enqueue(c.encode(`data: ${JSON.stringify({type:"connected"})}

`)),e=setInterval(()=>{try{s.enqueue(c.encode(`: heartbeat

`));}catch{e&&clearInterval(e),G.removeClient(n);}},3e4);},cancel(){e&&clearInterval(e),G.removeClient(n);}});return new Response(u,{headers:{"Content-Type":"text/event-stream","Cache-Control":"no-cache",Connection:"keep-alive","X-Accel-Buffering":"no"}})};

export { f as GET };
//# sourceMappingURL=_server.ts-B21Cc33I.js.map

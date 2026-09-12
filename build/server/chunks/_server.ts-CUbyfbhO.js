import { d as fe, v as w, r as _, u as e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import b from 'path';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

async function R(s){try{const e$1=await fe.select({roleName:_.name}).from(e).innerJoin(_,eq(e.roleId,_.id)).where(eq(e.id,s)).limit(1);return e$1.length>0&&(e$1[0].roleName==="admin"||e$1[0].roleName==="owner")}catch{return  false}}const I=async({params:s,cookies:e})=>{const u=e.get("session_token");if(!u)return console.error("[VoiceTraining Audio] No session token cookie"),new Response("Unauthorized - no session token",{status:401});const{validateSession:p}=await import('./auth-CFRsUa-j.js').then(o=>o.m),t=await p(u);if(!t.success||!t.user)return console.error("[VoiceTraining Audio] Invalid session"),new Response("Unauthorized - invalid session",{status:401});const w$1=t.user;if(!await R(w$1.id))return new Response("Admin access required",{status:403});try{const o=parseInt(s.id),[n]=await fe.select().from(w).where(eq(w.id,o)).limit(1);if(!n||!n.audioPath)return new Response("Sample not found",{status:404});const d=b.join(process.cwd(),n.audioPath);if(!existsSync(d))return new Response("Audio file not found",{status:404});const c=await readFile(d),f=(n.audioFormat||"wav")==="webm"?"audio/webm":"audio/wav";return new Response(c,{headers:{"Content-Type":f,"Content-Length":c.length.toString(),"Cache-Control":"private, max-age=3600"}})}catch(o){return console.error("Error serving audio:",o),new Response("Failed to serve audio",{status:500})}};

export { I as GET };
//# sourceMappingURL=_server.ts-CUbyfbhO.js.map

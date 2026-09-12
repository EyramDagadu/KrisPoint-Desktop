import { j as json } from './index-Djsj11qr.js';
import { d as fe, v as w, b as b$1, u as e } from './db-C6eh-v9M.js';
import { and, eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

async function h(i){const o=i.headers.get("Authorization");if(!o?.startsWith("Bearer "))return null;const a=o.substring(7);try{const r=await fe.select().from(b$1).where(eq(b$1.sessionToken,a)).limit(1);if(r.length===0||!r[0].isValid)return null;const c=r[0];if(new Date(c.expiresAt)<new Date)return null;const e$1=await fe.select().from(e).where(eq(e.id,c.userId)).limit(1);return e$1.length===0?null:e$1[0]}catch(r){return console.error("Session verification error:",r),null}}const b=async({request:i,params:o})=>{const a=await h(i);if(!a)return json({success:false,error:"Unauthorized"},{status:401});try{const r=parseInt(o.id),c=await i.json(),{correctedTranscript:e}=c;if(e===void 0)return json({success:!1,error:"Corrected transcript is required"},{status:400});const[d]=await fe.select().from(w).where(and(eq(w.id,r),eq(w.userId,a.id))).limit(1);if(!d)return json({success:!1,error:"Sample not found or not owned by user"},{status:404});const l={correctedTranscript:e.trim(),updatedAt:new Date};d.adminEditedTranscript||(l.finalTranscript=e.trim());const[m]=await fe.update(w).set(l).where(eq(w.id,r)).returning();return json({success:!0,sample:m})}catch(r){return console.error("Error updating corrected transcript:",r),json({success:false,error:"Failed to update correction"},{status:500})}};

export { b as PATCH };
//# sourceMappingURL=_server.ts-BbTslcS0.js.map

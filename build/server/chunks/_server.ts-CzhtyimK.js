import { j as json } from './index-Djsj11qr.js';
import { d as fe, a as S } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const h=async({request:n})=>{try{const e=await X(n);if(!e.success||!e.user)return json({error:"Unauthorized"},{status:401});const s=e.user.id,d=await n.json(),{isOnline:o,status:i}=d,u=await fe.select().from(S).where(eq(S.userId,s)).limit(1);return u.length===0?await fe.insert(S).values({userId:s,isOnline:o??!0,status:i??"available",lastSeenAt:new Date}):await fe.update(S).set({isOnline:o??!0,status:i??u[0].status,lastSeenAt:new Date,updatedAt:new Date}).where(eq(S.userId,s)),json({success:!0})}catch(e){return console.error("Error updating presence:",e),json({error:"Failed to update presence"},{status:500})}};

export { h as POST };
//# sourceMappingURL=_server.ts-CzhtyimK.js.map

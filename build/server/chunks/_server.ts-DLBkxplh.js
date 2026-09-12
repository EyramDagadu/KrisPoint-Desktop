import { j as json } from './index-Djsj11qr.js';
import { d as fe, u as e, c as v } from './db-C6eh-v9M.js';
import { and, eq, or } from 'drizzle-orm';
import { v as X } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const A=async({request:c,params:u})=>{try{const t=await X(c);if(!t.success||!t.user)return json({error:"Unauthorized"},{status:401});const d=t.user.id,s=parseInt(u.userId);if(isNaN(s)||s===d)return json({error:"Invalid user ID"},{status:400});if((await fe.select({id:e.id}).from(e).where(and(eq(e.id,s),eq(e.isActive,!0))).limit(1)).length===0)return json({error:"User not found"},{status:404});const m=await fe.select({id:v.id,senderId:v.senderId,receiverId:v.receiverId,content:v.content,isRead:v.isRead,readAt:v.readAt,createdAt:v.createdAt}).from(v).where(or(and(eq(v.senderId,d),eq(v.receiverId,s)),and(eq(v.senderId,s),eq(v.receiverId,d)))).orderBy(v.createdAt).limit(100);return await fe.update(v).set({isRead:!0,readAt:new Date}).where(and(eq(v.senderId,s),eq(v.receiverId,d),eq(v.isRead,!1))),json({messages:m})}catch(t){return console.error("Error fetching messages:",t),json({error:"Failed to fetch messages"},{status:500})}};

export { A as GET };
//# sourceMappingURL=_server.ts-DLBkxplh.js.map

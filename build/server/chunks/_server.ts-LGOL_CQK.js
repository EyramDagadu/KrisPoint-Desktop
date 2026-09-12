import { j as json } from './index-Djsj11qr.js';
import { d as fe, u as e, c as v } from './db-C6eh-v9M.js';
import { sql, eq, and } from 'drizzle-orm';
import { v as X } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const q=async({request:a})=>{try{const s=await X(a);if(!s.success||!s.user)return json({error:"Unauthorized"},{status:401});const d=s.user.id,o=await fe.select({senderId:v.senderId,senderName:e.fullName,senderTitle:e.title,count:sql`cast(count(*) as integer)`}).from(v).innerJoin(e,eq(v.senderId,e.id)).where(and(eq(v.receiverId,d),eq(v.isRead,!1))).groupBy(v.senderId,e.fullName,e.title),u=o.reduce((c,i)=>c+i.count,0);return json({totalUnread:u,unreadBySender:o})}catch(s){return console.error("Error fetching unread count:",s),json({error:"Failed to fetch unread count"},{status:500})}};

export { q as GET };
//# sourceMappingURL=_server.ts-LGOL_CQK.js.map

import { j as json } from './index-Djsj11qr.js';
import { d as fe, a as S, u as e } from './db-C6eh-v9M.js';
import { eq, and, ne, sql } from 'drizzle-orm';
import { v as X } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const T=async({request:o})=>{try{const t=await X(o);if(!t.success||!t.user)return json({error:"Unauthorized"},{status:401});const a=t.user.id,l=120*1e3,u=Date.now(),c=(await fe.select({id:e.id,fullName:e.fullName,title:e.title,roleId:e.roleId,isOnline:S.isOnline,lastSeenAt:S.lastSeenAt,status:S.status}).from(e).leftJoin(S,eq(e.id,S.userId)).where(and(eq(e.isActive,!0),ne(e.id,a))).orderBy(sql`CASE WHEN ${S.isOnline} = true THEN 0 ELSE 1 END`,e.fullName)).map(r=>{if(r.isOnline&&r.lastSeenAt){const m=new Date(r.lastSeenAt).getTime();if(u-m>l)return {...r,isOnline:!1}}return r});return json({users:c})}catch(t){return console.error("Error fetching chat users:",t),json({error:"Failed to fetch users"},{status:500})}};

export { T as GET };
//# sourceMappingURL=_server.ts-BxUI9WJT.js.map

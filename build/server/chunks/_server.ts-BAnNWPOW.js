import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X } from './auth-CFRsUa-j.js';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const g=async({request:c})=>{try{console.log("GET /api/users/specialists called");const t=await X(c);if(!t.success||!t.user)return console.log("Specialists endpoint: Unauthorized"),json({success:!1,error:"Unauthorized"},{status:401});const o=await fe.select().from(_e.roles).where(eq(_e.roles.name,"radiologist")).limit(1);if(console.log("Radiologist role found:",o),!o.length)return console.log("No radiologist role found in database"),json({success:!0,specialists:[]});const l=await fe.select({id:_e.users.id,fullName:_e.users.fullName,title:_e.users.title,specialty:_e.users.specialty,department:_e.users.department}).from(_e.users).where(and(eq(_e.users.roleId,o[0].id),eq(_e.users.isActive,!0)));return console.log("Found specialists:",l.length),json({success:!0,specialists:l.map(s=>({id:s.id,name:s.title?`${s.title} ${s.fullName}`:s.fullName,specialty:s.specialty||"",department:s.department||""}))})}catch(t){return console.error("Get specialists error:",t),json({success:false,error:"Failed to fetch specialists"},{status:500})}};

export { g as GET };
//# sourceMappingURL=_server.ts-BAnNWPOW.js.map

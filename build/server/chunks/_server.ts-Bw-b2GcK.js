import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X } from './auth-CFRsUa-j.js';
import { inArray, eq, and } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const w=async({request:a})=>{try{const e=await X(a);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const l=(await fe.select({id:_e.roles.id}).from(_e.roles).where(inArray(_e.roles.name,["radiologist","admin"]))).map(u=>u.id),c=await fe.select({id:_e.users.id,fullName:_e.users.fullName,title:_e.users.title,specialty:_e.users.specialty,department:_e.users.department,roleName:_e.roles.displayName}).from(_e.users).innerJoin(_e.roles,eq(_e.users.roleId,_e.roles.id)).where(and(inArray(_e.users.roleId,l),eq(_e.users.isActive,!0)));return json({success:!0,specialists:c})}catch(e){return console.error("Get specialists error:",e),json({success:false,error:"Failed to get specialists"},{status:500})}};

export { w as GET };
//# sourceMappingURL=_server.ts-Bw-b2GcK.js.map

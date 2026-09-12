import { j as json } from './index-Djsj11qr.js';
import { g as te, r as ee, a as C } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

async function n(a){const s=a.get("session_token");if(!s)return {authorized:false,error:"No session token"};const e=await C(s);return !e.success||!e.user?{authorized:false,error:"Invalid session"}:(e.permissions||[]).includes("users.manage")?{authorized:true,userId:e.user.id}:{authorized:false,error:"Insufficient permissions"}}const f=async({cookies:a})=>{try{const s=await n(a);if(!s.authorized)return json({success:!1,error:s.error},{status:403});const e=await te();return json({success:!0,users:e})}catch(s){return console.error("Get users API error:",s),json({success:false,error:"Internal server error"},{status:500})}},m=async({request:a,cookies:s})=>{try{const e=await n(s);if(!e.authorized)return json({success:!1,error:e.error},{status:403});const r=await a.json();if(!r.username||!r.password||!r.fullName||!r.roleId)return json({success:!1,error:"Missing required fields"},{status:400});const o=await ee({username:r.username,password:r.password,fullName:r.fullName,email:r.email,roleId:r.roleId,title:r.title,specialty:r.specialty,department:r.department,createdBy:e.userId});return o.success?json({success:!0,user:o.user}):json({success:!1,error:o.error},{status:400})}catch(e){return console.error("Create user API error:",e),json({success:false,error:"Internal server error"},{status:500})}};

export { f as GET, m as POST };
//# sourceMappingURL=_server.ts-DLEy1Ghb.js.map

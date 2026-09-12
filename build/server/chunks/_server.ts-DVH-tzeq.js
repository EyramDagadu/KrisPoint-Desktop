import { j as json } from './index-Djsj11qr.js';
import { a as C, r as ee } from './auth-CFRsUa-j.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { count, eq } from 'drizzle-orm';
import 'bcryptjs';
import 'crypto';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

const R=async({request:u})=>{try{const c=u.headers.get("authorization")?.replace("Bearer ","");let f,o=!1;if(o=((await fe.select({count:count()}).from(_e.users))[0]?.count||0)===0,process.env.VITE_KRISPOINT_EDITION==="solo"&&!o)return json({success:!1,error:"This Solo workspace already has an owner. Additional users are not supported."},{status:403});if(c){const e=await C(c);if(e.success&&e.user&&(f=e.user.id,!e.permissions?.includes("users.create")))return json({success:!1,error:"Insufficient permissions to create users"},{status:403})}else if(!o)return json({success:!1,error:"Authentication required. Only the first user can self-register."},{status:401});const r=await u.json();if(!r.username||!r.password||!r.fullName)return json({success:!1,error:"Username, password, and full name are required"},{status:400});if(o){const e=await fe.select().from(_e.roles).where(eq(_e.roles.name,"owner")).limit(1);e.length&&(r.roleId=e[0].id);}if(!r.roleId)return json({success:!1,error:"Role is required"},{status:400});if(!o&&r.roleId){const e=await fe.select().from(_e.roles).where(eq(_e.roles.name,"owner")).limit(1);if(e.length&&r.roleId===e[0].id&&(await fe.select().from(_e.users).where(eq(_e.users.roleId,e[0].id)).limit(1)).length)return json({success:!1,error:"Only one user can have the System Owner role"},{status:400})}if(r.password.length<8)return json({success:!1,error:"Password must be at least 8 characters long"},{status:400});const n=await ee({...r,createdBy:f});return n.success?json(n,{status:201}):json(n,{status:400})}catch(l){return console.error("Registration API error:",l),json({success:false,error:"Internal server error"},{status:500})}};

export { R as POST };
//# sourceMappingURL=_server.ts-DVH-tzeq.js.map

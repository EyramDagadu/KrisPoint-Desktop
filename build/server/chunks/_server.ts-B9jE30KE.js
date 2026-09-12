import { j as json } from './index-Djsj11qr.js';
import { a as C, g as te } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const f=async({request:a})=>{try{const t=a.headers.get("authorization")?.replace("Bearer ","");if(!t)return json({success:!1,error:"Authentication required"},{status:401});const e=await C(t);if(!e.success)return json(e,{status:401});if(!e.permissions?.includes("users.view"))return json({success:!1,error:"Insufficient permissions"},{status:403});const o=await te();return json({success:!0,users:o})}catch(r){return console.error("Get users API error:",r),json({success:false,error:"Internal server error"},{status:500})}};

export { f as GET };
//# sourceMappingURL=_server.ts-B9jE30KE.js.map

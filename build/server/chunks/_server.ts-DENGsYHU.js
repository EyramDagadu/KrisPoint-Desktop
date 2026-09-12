import { j as json } from './index-Djsj11qr.js';
import { a as C } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const c=async({cookies:o})=>{try{const r=o.get("session_token");if(!r)return json({success:!1,error:"No session token provided"},{status:401});const e=await C(r);return e.success?json(e):json(e,{status:401})}catch(r){return console.error("Session validation API error:",r),json({success:false,error:"Internal server error"},{status:500})}};

export { c as GET };
//# sourceMappingURL=_server.ts-DENGsYHU.js.map

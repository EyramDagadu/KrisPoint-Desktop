import { j as json } from './index-Djsj11qr.js';
import { f as Q } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const u=async({cookies:e})=>{try{const r=e.get("session_token");if(!r)return json({success:!1,error:"No session token provided"},{status:400});const s=await Q(r);return e.delete("session_token",{path:"/"}),e.delete("refresh_token",{path:"/"}),json(s)}catch(r){return console.error("Logout API error:",r),json({success:false,error:"Internal server error"},{status:500})}};

export { u as POST };
//# sourceMappingURL=_server.ts-nnuTacVt.js.map

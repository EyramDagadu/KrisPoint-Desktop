import { j as json } from './index-Djsj11qr.js';
import { h as se } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const l=async()=>{try{const r=await se(),s=process.env.VITE_KRISPOINT_EDITION==="solo"?r.filter(o=>o.name==="owner"):r;return json({success:!0,roles:s,singleOwner:process.env.VITE_KRISPOINT_EDITION==="solo"})}catch(r){return console.error("Get roles API error:",r),json({success:false,error:"Internal server error"},{status:500})}};

export { l as GET };
//# sourceMappingURL=_server.ts-BILwJEfh.js.map

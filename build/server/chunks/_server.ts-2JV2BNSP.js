import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

const m=async({request:o})=>{try{const{username:r}=await o.json();if(!r)return json({success:!1,error:"Username is required"},{status:400});const e=await fe.select({securityQuestion:_e.users.securityQuestion}).from(_e.users).where(eq(_e.users.username,r.trim())).limit(1);return e.length===0?json({success:!1,error:"Username not found"},{status:404}):e[0].securityQuestion?json({success:!0,question:e[0].securityQuestion}):json({success:!1,error:"No security question set for this account. Please contact an administrator."},{status:400})}catch(r){return console.error("Get security question error:",r),json({success:false,error:"An error occurred"},{status:500})}};

export { m as POST };
//# sourceMappingURL=_server.ts-2JV2BNSP.js.map

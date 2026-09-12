import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import T from 'bcryptjs';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

const y=async({request:a})=>{try{const{username:s,answer:o}=await a.json();if(!s||!o)return json({success:!1,error:"Username and answer are required"},{status:400});const t=await fe.select({id:_e.users.id,securityAnswer:_e.users.securityAnswer}).from(_e.users).where(eq(_e.users.username,s.trim())).limit(1);if(t.length===0)return json({success:!1,error:"Username not found"},{status:404});if(!t[0].securityAnswer)return json({success:!1,error:"No security answer set for this account"},{status:400});const c=o.trim().toLowerCase();return await T.compare(c,t[0].securityAnswer)?json({success:!0}):json({success:!1,error:"Incorrect answer"},{status:401})}catch(s){return console.error("Verify security answer error:",s),json({success:false,error:"An error occurred"},{status:500})}};

export { y as POST };
//# sourceMappingURL=_server.ts-BXH823Z0.js.map

import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import T from 'bcryptjs';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'crypto';

const S=async({request:u})=>{try{const e=await X(u);if(!e.success||!e.user)return json({success:!1,error:"Not authenticated"},{status:401});const{securityQuestion:s,securityAnswer:t}=await u.json();if(!s||!t)return json({success:!1,error:"Security question and answer are required"},{status:400});if(s.trim().length<5)return json({success:!1,error:"Security question must be at least 5 characters"},{status:400});if(t.trim().length<2)return json({success:!1,error:"Security answer must be at least 2 characters"},{status:400});const i=t.trim().toLowerCase(),o=await T.hash(i,10);return await fe.update(_e.users).set({securityQuestion:s.trim(),securityAnswer:o,updatedAt:new Date}).where(eq(_e.users.id,e.user.id)),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"SECURITY_QUESTION_UPDATED",category:"SECURITY",severity:"INFO",resourceType:"USER",resourceId:String(e.user.id),description:"User updated their security question"}),json({success:!0,message:"Security question updated successfully"})}catch(e){return console.error("Update security question error:",e),json({success:false,error:"An error occurred"},{status:500})}};

export { S as POST };
//# sourceMappingURL=_server.ts-BG_yFesY.js.map

import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { b as F, l as m } from './auth-CFRsUa-j.js';
import T from 'bcryptjs';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'crypto';

const g=async({request:n})=>{try{const{username:e,newPassword:t}=await n.json();if(!e||!t)return json({success:!1,error:"Username and new password are required"},{status:400});const d=F(t);if(!d.valid)return json({success:!1,error:d.errors.join(". ")},{status:400});const r=await fe.select({id:_e.users.id}).from(_e.users).where(eq(_e.users.username,e.trim())).limit(1);if(r.length===0)return json({success:!1,error:"Username not found"},{status:404});const u=await T.hash(t,10);return await fe.update(_e.users).set({password:u,lastPasswordChangeAt:new Date,mustChangePassword:!1,failedLoginAttempts:0,lockedUntil:null,updatedAt:new Date}).where(eq(_e.users.id,r[0].id)),await fe.update(_e.sessions).set({isValid:!1,revokedAt:new Date,revokedReason:"Password reset"}).where(eq(_e.sessions.userId,r[0].id)),await m({userId:r[0].id,username:e.trim(),action:"PASSWORD_RESET_COMPLETED",category:"SECURITY",severity:"WARNING",resourceType:"USER",resourceId:String(r[0].id),description:"Password reset via security question, all sessions invalidated"}),json({success:!0,message:"Password reset successfully"})}catch(e){return console.error("Reset password error:",e),json({success:false,error:"An error occurred"},{status:500})}};

export { g as POST };
//# sourceMappingURL=_server.ts-DOVhAd5Q.js.map

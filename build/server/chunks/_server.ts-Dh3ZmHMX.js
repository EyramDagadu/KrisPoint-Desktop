import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X, b as F, l as m } from './auth-CFRsUa-j.js';
import T from 'bcryptjs';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'crypto';

const S=async({request:t})=>{try{const s=await X(t);if(!s.success||!s.user)return json({success:!1,error:"Not authenticated"},{status:401});const{currentPassword:o,newPassword:a}=await t.json();if(!o||!a)return json({success:!1,error:"Current password and new password are required"},{status:400});const u=F(a);if(!u.valid)return json({success:!1,error:u.errors.join(". ")},{status:400});const d=await fe.select({id:_e.users.id,password:_e.users.password}).from(_e.users).where(eq(_e.users.id,s.user.id)).limit(1);if(d.length===0)return json({success:!1,error:"User not found"},{status:404});if(!await T.compare(o,d[0].password))return json({success:!1,error:"Current password is incorrect"},{status:401});const w=await T.hash(a,10);return await fe.update(_e.users).set({password:w,lastPasswordChangeAt:new Date,mustChangePassword:!1,updatedAt:new Date}).where(eq(_e.users.id,s.user.id)),await m({userId:s.user.id,username:s.user.username,userRole:s.user.roleName,action:"PASSWORD_CHANGED",category:"SECURITY",severity:"INFO",resourceType:"USER",resourceId:String(s.user.id),description:"User changed their password"}),json({success:!0,message:"Password changed successfully"})}catch(s){return console.error("Change password error:",s),json({success:false,error:"An error occurred"},{status:500})}};

export { S as POST };
//# sourceMappingURL=_server.ts-Dh3ZmHMX.js.map

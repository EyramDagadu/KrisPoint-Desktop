import { j as json } from './index-Djsj11qr.js';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import T from 'bcryptjs';
import 'crypto';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

function p(){const n="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";let i="";for(let e=0;e<12;e++)i+=n.charAt(Math.floor(Math.random()*n.length));return i}const R=async({params:n,request:i})=>{try{const e=await X(i);if(!e.success||!e.user)return json({success:!1,error:"Authentication required"},{status:401});if(!(e.permissions?.includes("users.edit")||e.permissions?.includes("users.manage")))return json({success:!1,error:"Only administrators can reset passwords"},{status:403});const t=parseInt(n.id);if(e.user.id===t)return json({success:!1,error:"Cannot reset your own password this way. Use the change password feature in Settings."},{status:400});const[u]=await fe.select({id:_e.users.id,username:_e.users.username,fullName:_e.users.fullName,roleId:_e.users.roleId}).from(_e.users).where(eq(_e.users.id,t)).limit(1);if(!u)return json({success:!1,error:"User not found"},{status:404});const[c]=await fe.select({name:_e.roles.name}).from(_e.roles).where(eq(_e.roles.id,u.roleId)).limit(1);if(c?.name==="owner"){const[m]=await fe.select({name:_e.roles.name}).from(_e.roles).where(eq(_e.roles.id,e.user.roleId)).limit(1);if(m?.name!=="owner")return json({success:!1,error:"Only the System Owner can reset another System Owner's password"},{status:403})}const d=p(),l=await T.hash(d,12);return await fe.update(_e.users).set({password:l,mustChangePassword:!0,failedLoginAttempts:0,lockedUntil:null,lastPasswordChangeAt:new Date,updatedAt:new Date}).where(eq(_e.users.id,t)),await fe.delete(_e.sessions).where(eq(_e.sessions.userId,t)),await m({userId:e.user.id,username:e.user.username,action:"PASSWORD_RESET_BY_ADMIN",category:"SECURITY",severity:"WARNING",resourceType:"USER",resourceId:String(t),description:`Password reset by admin for user ${u.username} (${u.fullName}). User must change password on next login.`}),json({success:!0,temporaryPassword:d,message:"Password reset successful. The user must change their password on next login."})}catch(e){return console.error("Password reset error:",e),json({success:false,error:"Failed to reset password"},{status:500})}};

export { R as POST };
//# sourceMappingURL=_server.ts-D8I1wl9R.js.map

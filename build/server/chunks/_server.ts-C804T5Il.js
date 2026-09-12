import { j as json } from './index-Djsj11qr.js';
import { d as fe, o as K } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const o="organization_letterhead",w=async({request:t})=>{try{const e=await X(t);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const[a]=await fe.select().from(K).where(eq(K.key,o)).limit(1);if(!a||!a.value)return json({success:!0,letterhead:null});const u=JSON.parse(a.value);return json({success:!0,letterhead:u})}catch(e){return console.error("Get letterhead error:",e),json({success:false,error:"Failed to get letterhead"},{status:500})}},S=async({request:t})=>{try{const e=await X(t);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(e.user.id,"settings.manage"))return json({success:!1,error:"Permission denied. Only admins can manage letterhead."},{status:403});const u=await t.json(),{letterhead:m$1,settings:g}=u,d=JSON.stringify({currentLetterhead:m$1,settings:g||{height:120,opacity:1,position:"top",margin:20,topMargin:10}}),[f]=await fe.select({id:K.id}).from(K).where(eq(K.key,o)).limit(1);return f?await fe.update(K).set({value:d,updatedBy:e.user.id,updatedAt:new Date}).where(eq(K.key,o)):await fe.insert(K).values({key:o,value:d,description:"Organization letterhead for PDF exports",updatedBy:e.user.id}),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"LETTERHEAD_UPDATED",category:"SETTINGS",severity:"INFO",resourceType:"SETTING",resourceId:"organization_letterhead",description:"Organization letterhead updated"}),json({success:!0})}catch(e){return console.error("Save letterhead error:",e),json({success:false,error:"Failed to save letterhead"},{status:500})}},v=async({request:t})=>{try{const e=await X(t);return !e.success||!e.user?json({success:!1,error:"Unauthorized"},{status:401}):await J(e.user.id,"settings.manage")?(await fe.delete(K).where(eq(K.key,o)),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"LETTERHEAD_DELETED",category:"SETTINGS",severity:"WARNING",resourceType:"SETTING",resourceId:"organization_letterhead",description:"Organization letterhead deleted"}),json({success:!0})):json({success:!1,error:"Permission denied"},{status:403})}catch(e){return console.error("Delete letterhead error:",e),json({success:false,error:"Failed to delete letterhead"},{status:500})}};

export { v as DELETE, w as GET, S as POST };
//# sourceMappingURL=_server.ts-C804T5Il.js.map

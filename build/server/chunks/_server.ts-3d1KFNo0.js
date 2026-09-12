import { j as json } from './index-Djsj11qr.js';
import { d as fe, u as e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const y=async({request:a})=>{try{const e$1=await X(a);if(!e$1.success||!e$1.user)return json({success:!1,error:"Unauthorized"},{status:401});const[s]=await fe.select({signatureUrl:e.signatureUrl,signatureName:e.signatureName}).from(e).where(eq(e.id,e$1.user.id)).limit(1);return !s||!s.signatureUrl?json({success:!0,signature:null}):json({success:!0,signature:{url:s.signatureUrl,name:s.signatureName}})}catch(e){return console.error("Get signature error:",e),json({success:false,error:"Failed to get signature"},{status:500})}},E=async({request:a})=>{try{const e$1=await X(a);if(!e$1.success||!e$1.user)return json({success:!1,error:"Unauthorized"},{status:401});let s;try{s=await a.json();}catch(m){return console.error("JSON parse error:",m),json({success:!1,error:"Invalid request data - signature may be too large"},{status:400})}const{signatureUrl:u,signatureName:d}=s;if(!u)return json({success:!1,error:"Signature data is required"},{status:400});const c=u.length,l=5e5;return c>l?(console.error(`Signature too large: ${c} bytes (max ${l})`),json({success:!1,error:"Signature image is too large. Please use a smaller image."},{status:400})):(await fe.update(e).set({signatureUrl:u,signatureName:d||"Digital Signature",updatedAt:new Date}).where(eq(e.id,e$1.user.id)),await m({userId:e$1.user.id,username:e$1.user.username,userRole:e$1.user.roleName,action:"SIGNATURE_UPDATED",category:"SETTINGS",severity:"INFO",resourceType:"USER",resourceId:String(e$1.user.id),description:"Digital signature updated"}),json({success:!0}))}catch(e){console.error("Save signature error:",e);const s=e?.message||"Failed to save signature";return json({success:false,error:s},{status:500})}},w=async({request:a})=>{try{const e$1=await X(a);return !e$1.success||!e$1.user?json({success:!1,error:"Unauthorized"},{status:401}):(await fe.update(e).set({signatureUrl:null,signatureName:null,updatedAt:new Date}).where(eq(e.id,e$1.user.id)),await m({userId:e$1.user.id,username:e$1.user.username,userRole:e$1.user.roleName,action:"SIGNATURE_DELETED",category:"SETTINGS",severity:"WARNING",resourceType:"USER",resourceId:String(e$1.user.id),description:"Digital signature deleted"}),json({success:!0}))}catch(e){return console.error("Delete signature error:",e),json({success:false,error:"Failed to delete signature"},{status:500})}};

export { w as DELETE, y as GET, E as POST };
//# sourceMappingURL=_server.ts-3d1KFNo0.js.map

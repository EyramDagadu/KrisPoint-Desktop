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

const h=async({request:c,url:e})=>{try{const u=await X(c);if(!u.success||!u.user)return json({success:!1,error:"Unauthorized"},{status:401});const l=e.searchParams.get("key");if(l){const[r]=await fe.select().from(K).where(eq(K.key,l)).limit(1);if(!r)return json({success:!0,value:null});try{return json({success:!0,value:JSON.parse(r.value||"{}")})}catch{return json({success:!0,value:r.value})}}const o=(await fe.select().from(K)).reduce((r,i)=>{try{r[i.key]=JSON.parse(i.value||"{}");}catch{r[i.key]=i.value;}return r},{});return json({success:!0,settings:o})}catch(u){return console.error("Get settings error:",u),json({success:false,error:"Failed to get settings"},{status:500})}},S=async({request:c})=>{try{const e=await X(c);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(e.user.id,"settings.manage"))return json({success:!1,error:"Permission denied"},{status:403});const l=await c.json(),{key:a,value:o}=l;if(!a)return json({success:!1,error:"Key is required"},{status:400});const r=typeof o=="string"?o:JSON.stringify(o),[i]=await fe.select({id:K.id}).from(K).where(eq(K.key,a)).limit(1);return i?await fe.update(K).set({value:r,updatedBy:e.user.id,updatedAt:new Date}).where(eq(K.key,a)):await fe.insert(K).values({key:a,value:r,updatedBy:e.user.id}),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"ORGANIZATION_SETTING_UPDATED",category:"SETTINGS",severity:"INFO",resourceType:"SETTING",resourceId:a,description:`Organization setting '${a}' updated`}),json({success:!0})}catch(e){return console.error("Save setting error:",e),json({success:false,error:"Failed to save setting"},{status:500})}};

export { h as GET, S as POST };
//# sourceMappingURL=_server.ts-C6Ga0uhY.js.map

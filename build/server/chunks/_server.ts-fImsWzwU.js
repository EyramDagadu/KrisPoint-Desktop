import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X, c as J } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const n="organization_institution",y=async({request:i})=>{try{const t=await X(i);if(!t.success||!t.user)return json({success:!1,error:"Unauthorized"},{status:401});const[c]=await fe.select().from(_e.organizationSettings).where(eq(_e.organizationSettings.key,n)).limit(1),a=c?.value||"";return json({success:!0,institution:a})}catch(t){return console.error("Error fetching organization settings:",t),json({success:false,error:"Failed to fetch organization settings"},{status:500})}},h=async({request:i})=>{try{const t=await X(i);if(!t.success||!t.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(t.user.id,"settings.manage"))return json({success:!1,error:"Permission denied. Only administrators can update organization settings."},{status:403});const a=await i.json(),{institution:o}=a;if(typeof o!="string")return json({success:!1,error:"Institution name is required"},{status:400});const[d]=await fe.select({id:_e.organizationSettings.id}).from(_e.organizationSettings).where(eq(_e.organizationSettings.key,n)).limit(1);return d?await fe.update(_e.organizationSettings).set({value:o.trim(),updatedBy:t.user.id,updatedAt:new Date}).where(eq(_e.organizationSettings.key,n)):await fe.insert(_e.organizationSettings).values({key:n,value:o.trim(),description:"Organization/Institution name displayed on reports",updatedBy:t.user.id}),json({success:!0})}catch(t){return console.error("Error updating organization settings:",t),json({success:false,error:"Failed to update organization settings"},{status:500})}};

export { y as GET, h as POST };
//# sourceMappingURL=_server.ts-fImsWzwU.js.map

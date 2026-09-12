import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { and, eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const h=async({request:u,params:n})=>{try{const e=await X(u);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(e.user.id,"reports.review"))return json({success:!1,error:"Permission denied"},{status:403});const t=parseInt(n.id),a=parseInt(n.addendumId);if(isNaN(t)||isNaN(a))return json({success:!1,error:"Invalid ID"},{status:400});const[d]=await fe.select().from(_e.reportAmendments).where(and(eq(_e.reportAmendments.id,a),eq(_e.reportAmendments.reportId,t))).limit(1);return d?d.status!=="SUBMITTED"?json({success:!1,error:"Only submitted addendums can be claimed"},{status:400}):d.assignedSpecialistId===e.user.id?json({success:!1,error:"This addendum is already assigned to you"},{status:400}):(await fe.update(_e.reportAmendments).set({assignedSpecialistId:e.user.id,updatedAt:new Date}).where(eq(_e.reportAmendments.id,a)),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"ADDENDUM_CLAIMED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(a),description:`Addendum claimed for review on report ${t}`,metadata:{reportId:t,previousSpecialistId:d.assignedSpecialistId}}),json({success:!0})):json({success:!1,error:"Addendum not found"},{status:404})}catch(e){return console.error("Claim addendum error:",e),json({success:false,error:"Failed to claim addendum"},{status:500})}};

export { h as POST };
//# sourceMappingURL=_server.ts-7MbUbEHJ.js.map

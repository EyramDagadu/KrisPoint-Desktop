import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { p } from './reportEvents-Ce-jVB2J.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const v=async({request:u,params:c})=>{try{const e=await X(u);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(e.user.id,"reports.review"))return json({success:!1,error:"Permission denied"},{status:403});const r=parseInt(c.id);if(isNaN(r))return json({success:!1,error:"Invalid report ID"},{status:400});const[t]=await fe.select().from(_e.reports).where(eq(_e.reports.id,r)).limit(1);return t?t.status!=="SUBMITTED"?json({success:!1,error:"Only submitted reports can be claimed"},{status:400}):t.assignedSpecialistId===e.user.id?json({success:!1,error:"This report is already assigned to you"},{status:400}):(await fe.update(_e.reports).set({assignedSpecialistId:e.user.id,updatedAt:new Date}).where(eq(_e.reports.id,r)),await fe.insert(_e.reportWorkflows).values({reportId:r,event:"CLAIMED",userId:e.user.id,userRole:e.user.roleName,occurredAt:new Date,metadata:{previousSpecialistId:t.assignedSpecialistId,claimedBy:e.user.id}}),p.notifyReportClaimed(r,e.user.id,t.assignedSpecialistId),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"REPORT_CLAIMED",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(r),description:"Report claimed for review",metadata:{previousSpecialistId:t.assignedSpecialistId}}),json({success:!0})):json({success:!1,error:"Report not found"},{status:404})}catch(e){return console.error("Claim report error:",e),json({success:false,error:"Failed to claim report"},{status:500})}};

export { v as POST };
//# sourceMappingURL=_server.ts-BYm93eUb.js.map

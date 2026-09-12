import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const A=async({request:c,params:l})=>{try{const e=await X(c);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const t=parseInt(l.id);if(isNaN(t))return json({success:!1,error:"Invalid ID"},{status:400});const d=await c.json().catch(()=>({})),{reason:n}=d,[a]=await fe.select().from(_e.reports).where(eq(_e.reports.id,t)).limit(1);if(!a)return json({success:!1,error:"Report not found"},{status:404});if(a.status==="SIGNED")return json({success:!1,error:"Cannot cancel a signed report"},{status:400});if(a.status==="SUBMITTED")return json({success:!1,error:"Cannot cancel a report under review. Ask the specialist to return it first."},{status:400});const p=a.openedBy===e.user.id,m$1=a.createdBy===e.user.id,f=a.assignedSpecialistId===e.user.id;if(!p&&!m$1&&!f)return json({success:!1,error:"You can only cancel reports you have picked up"},{status:403});const i=new Date,[w]=await fe.update(_e.reports).set({status:"DRAFT",content:null,findings:null,impressions:null,recommendations:null,technique:null,comparison:null,openedBy:null,openedAt:null,assignedSpecialistId:null,updatedAt:i}).where(eq(_e.reports.id,t)).returning();return await fe.update(_e.worklist).set({status:"PENDING",updatedAt:i}).where(eq(_e.worklist.reportId,t)),await fe.insert(_e.reportWorkflows).values({reportId:t,event:"CANCELLED",userId:e.user.id,userRole:e.user.roleName,occurredAt:i,metadata:n?{reason:n}:null}),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"REPORT_CANCELLED",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(t),description:"Report cancelled and released back to worklist",metadata:{reason:n||"No reason provided"}}),json({success:!0,report:w,message:"Report cancelled and released back to worklist"})}catch(e){return console.error("Cancel report error:",e),json({success:false,error:"Failed to cancel report"},{status:500})}};

export { A as POST };
//# sourceMappingURL=_server.ts-NDVWjE1g.js.map

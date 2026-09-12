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

const P=async({request:p$1,params:l})=>{try{const e=await X(p$1);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const m$1=await J(e.user.id,"reports.sign_own"),c=await J(e.user.id,"reports.finalize");if(!m$1&&!c)return json({success:!1,error:"Permission denied"},{status:403});const t=parseInt(l.id);if(isNaN(t))return json({success:!1,error:"Invalid ID"},{status:400});const[r]=await fe.select().from(_e.reports).where(eq(_e.reports.id,t)).limit(1);if(!r)return json({success:!1,error:"Report not found"},{status:404});if(r.createdBy!==e.user.id&&!c)return json({success:!1,error:"You can only sign off your own reports"},{status:403});const i=new Date;if(r.status==="SIGNED")return json({success:!1,error:'Report is already signed. Use "Undo Sign Off" first if you need to make changes.'},{status:400});if(r.status==="SUBMITTED")return json({success:!1,error:"Report is awaiting specialist review. Use standard sign endpoint."},{status:400});const g=2147483647;let n=r.reportingDurationMs;if(r.openedAt){const d=i.getTime()-new Date(r.openedAt).getTime();n=d>g?null:d;}const[w]=await fe.update(_e.reports).set({status:"SIGNED",statusBeforeSign:r.status,reviewedBy:null,signedBy:e.user.id,signedAt:i,reportingDurationMs:n,reviewDurationMs:null,updatedAt:i}).where(eq(_e.reports.id,t)).returning();await fe.insert(_e.reportWorkflows).values({reportId:t,event:"SIGNED_BY_CREATOR",userId:e.user.id,userRole:e.user.roleName,occurredAt:i});const[R]=await fe.update(_e.worklist).set({status:"COMPLETED",updatedAt:i}).where(eq(_e.worklist.reportId,t)).returning();return p.notifyReportStatusChange(t,R?.id||null,"COMPLETED","SIGNED"),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"REPORT_SELF_SIGNED",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(t),description:"Report signed off by creator",metadata:{reportingDurationMs:n}}),json({success:!0,report:w,message:"Report signed off successfully"})}catch(e){return console.error("Sign-off report error:",e),json({success:false,error:"Failed to sign off report"},{status:500})}};

export { P as POST };
//# sourceMappingURL=_server.ts-DEo5vH3-.js.map

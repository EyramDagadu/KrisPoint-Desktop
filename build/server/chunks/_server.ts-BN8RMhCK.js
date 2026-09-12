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

const P=async({request:w,params:S})=>{try{const s=await X(w);if(!s.success||!s.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(s.user.id,"reports.finalize"))return json({success:!1,error:"Permission denied"},{status:403});const r=parseInt(S.id);if(isNaN(r))return json({success:!1,error:"Invalid ID"},{status:400});const[e]=await fe.select().from(_e.reports).where(eq(_e.reports.id,r)).limit(1);if(!e)return json({success:!1,error:"Report not found"},{status:404});const t=new Date;if(e.status==="SIGNED")return json({success:!1,error:'Report is already signed. Use "Undo Sign Off" first if you need to make changes.'},{status:400});const p$1=2147483647;let f=e.reviewDurationMs,g=e.reportingDurationMs;if(e.status==="SUBMITTED"&&e.submittedAt){const n=t.getTime()-new Date(e.submittedAt).getTime();f=n>p$1?null:n;}else if(e.status==="DRAFT"&&e.openedAt){const n=t.getTime()-new Date(e.openedAt).getTime();g=n>p$1?null:n;}const m$1=e.status==="SUBMITTED"&&e.signedBy!==null;let d=e.signedBy,c=e.signedAt,a=e.reviewedBy;m$1?a=s.user.id:e.status==="SUBMITTED"?(a=s.user.id,d=s.user.id,c=t):(d=s.user.id,c=t,a=null);const[I]=await fe.update(_e.reports).set({status:"SIGNED",statusBeforeSign:e.status,reviewedBy:a,signedBy:d,signedAt:c,reportingDurationMs:g,reviewDurationMs:f,updatedAt:t}).where(eq(_e.reports.id,r)).returning();await fe.insert(_e.reportWorkflows).values({reportId:r,event:"SIGNED",userId:s.user.id,userRole:s.user.roleName,occurredAt:t}),await m({userId:s.user.id,username:s.user.username,action:"SIGN_REPORT",category:"REPORTS",severity:"INFO",resourceType:"report",resourceId:r.toString(),description:m$1?`Co-signed report #${r}`:`Signed report #${r}`});const[D]=await fe.update(_e.worklist).set({status:"COMPLETED",updatedAt:t}).where(eq(_e.worklist.reportId,r)).returning();return p.notifyReportStatusChange(r,D?.id||null,"COMPLETED","SIGNED"),json({success:!0,report:I,message:"Report signed successfully"})}catch(s){return console.error("Sign report error:",s),json({success:false,error:"Failed to sign report"},{status:500})}};

export { P as POST };
//# sourceMappingURL=_server.ts-BN8RMhCK.js.map

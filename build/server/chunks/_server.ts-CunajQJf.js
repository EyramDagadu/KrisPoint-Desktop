import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import { p } from './reportEvents-Ce-jVB2J.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const R=900*1e3,D=async({request:c,params:p$1})=>{try{const s=await X(c);if(!s.success||!s.user)return json({success:!1,error:"Unauthorized"},{status:401});const o=parseInt(p$1.id);if(isNaN(o))return json({success:!1,error:"Invalid report ID"},{status:400});const[t]=await fe.select({id:_e.reports.id,status:_e.reports.status,statusBeforeSign:_e.reports.statusBeforeSign,signedBy:_e.reports.signedBy,signedAt:_e.reports.signedAt,createdBy:_e.reports.createdBy,assignedSpecialistId:_e.reports.assignedSpecialistId}).from(_e.reports).where(eq(_e.reports.id,o)).limit(1);if(!t)return json({success:!1,error:"Report not found"},{status:404});if(t.status!=="SIGNED")return json({success:!1,error:"Report is not signed"},{status:400});if(t.signedBy!==s.user.id)return json({success:!1,error:"Only the signer can undo their sign-off"},{status:403});if(!t.signedAt)return json({success:!1,error:"Report has no sign-off timestamp"},{status:400});const l=new Date(t.signedAt).getTime(),i=Date.now()-l;if(i>=R){const m=Math.floor(i/6e4);return json({success:!1,error:`The 15-minute undo window has expired. Report was signed ${m} minutes ago.`},{status:400})}const u=new Date,n=t.statusBeforeSign||"DRAFT",[g]=await fe.update(_e.reports).set({status:n,statusBeforeSign:null,signedBy:null,signedAt:null,reviewedBy:null,assignedSpecialistId:n==="SUBMITTED"?t.assignedSpecialistId:null,updatedAt:u}).where(eq(_e.reports.id,o)).returning();await fe.insert(_e.reportWorkflows).values({reportId:o,event:"SIGN_UNDONE",userId:s.user.id,userRole:s.user.roleName,occurredAt:u,metadata:{previousSignedAt:t.signedAt,restoredToStatus:n,undoneWithinMinutes:Math.floor(i/6e4)}});const[f]=await fe.update(_e.worklist).set({status:"IN_PROGRESS",updatedAt:u}).where(eq(_e.worklist.reportId,o)).returning();return p.notifyReportStatusChange(o,f?.id||null,"IN_PROGRESS",n),console.log(`Report ${o} sign-off undone by user ${s.user.id} (${s.user.username})`),await m({userId:s.user.id,username:s.user.username,userRole:s.user.roleName,action:"REPORT_SIGN_UNDONE",category:"REPORTS",severity:"INFO",resourceType:"REPORT",resourceId:String(o),description:`Report sign-off undone, restored to ${n}`,metadata:{previousSignedAt:t.signedAt,restoredToStatus:n,undoneWithinMinutes:Math.floor(i/6e4)}}),json({success:!0,report:g,message:"Sign-off has been undone. You can continue editing."})}catch(s){return console.error("Undo sign error:",s),json({success:false,error:"Failed to undo sign-off"},{status:500})}};

export { D as POST };
//# sourceMappingURL=_server.ts-CunajQJf.js.map

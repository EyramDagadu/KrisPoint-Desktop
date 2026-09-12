import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J } from './auth-CFRsUa-j.js';
import { sql, and, eq, inArray } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const U=async({request:I})=>{try{const d=await X(I);if(!d.success||!d.user)return json({success:!1,error:"Unauthorized"},{status:401});const s=d.user.id;let c=0,m=0,p=0,l=0;if(await J(s,"reports.review")){const[u]=await fe.select({count:sql`count(*)`}).from(_e.reports).where(and(eq(_e.reports.status,"SUBMITTED"),eq(_e.reports.assignedSpecialistId,s)));c=Number(u?.count)||0;const[i]=await fe.select({count:sql`count(*)`}).from(_e.reportAmendments).where(and(eq(_e.reportAmendments.status,"SUBMITTED"),eq(_e.reportAmendments.assignedSpecialistId,s)));p=Number(i?.count)||0;}if(await J(s,"reports.submit")){const u=await fe.select({id:_e.reports.id}).from(_e.reports).where(and(eq(_e.reports.status,"DRAFT"),eq(_e.reports.createdBy,s)));if(u.length>0){const a=u.map(w=>w.id),t=await fe.select({reportId:_e.reportWorkflows.reportId}).from(_e.reportWorkflows).where(and(eq(_e.reportWorkflows.event,"RETURNED"),inArray(_e.reportWorkflows.reportId,a)));m=new Set(t.map(w=>w.reportId)).size;}const i=await fe.select({resourceId:_e.auditLogs.resourceId}).from(_e.auditLogs).where(and(eq(_e.auditLogs.action,"ADDENDUM_RETURNED"),eq(_e.auditLogs.resourceType,"ADDENDUM")));if(i.length>0){const a=i.map(t=>parseInt(t.resourceId||"0")).filter(t=>t>0);if(a.length>0){const[t]=await fe.select({count:sql`count(*)`}).from(_e.reportAmendments).where(and(eq(_e.reportAmendments.status,"DRAFT"),eq(_e.reportAmendments.createdBy,s),inArray(_e.reportAmendments.id,a)));l=Number(t?.count)||0;}}}return json({success:!0,counts:{pendingReviews:c+p,returnedReports:m+l,pendingReportReviews:c,pendingAddendumReviews:p,returnedReportCount:m,returnedAddendumCount:l}})}catch(d){return console.error("Get report counts error:",d),json({success:false,error:"Failed to get report counts"},{status:500})}};

export { U as GET };
//# sourceMappingURL=_server.ts-Dq7CYR8I.js.map

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

const E=async({request:u,params:d})=>{try{const r=await X(u);if(!r.success||!r.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(r.user.id,"reports.review"))return json({success:!1,error:"Permission denied"},{status:403});const e=parseInt(d.id);if(isNaN(e))return json({success:!1,error:"Invalid ID"},{status:400});const p$1=await u.json(),{reason:o}=p$1,[i]=await fe.select().from(_e.reports).where(eq(_e.reports.id,e)).limit(1);if(!i)return json({success:!1,error:"Report not found"},{status:404});if(i.status!=="SUBMITTED")return json({success:!1,error:"Can only return reports that are submitted for review"},{status:400});if(i.assignedSpecialistId!==r.user.id)return json({success:!1,error:"Only the assigned specialist can return this report"},{status:403});const c=new Date,[l]=await fe.update(_e.reports).set({status:"DRAFT",assignedSpecialistId:null,updatedAt:c}).where(eq(_e.reports.id,e)).returning();await fe.insert(_e.reportWorkflows).values({reportId:e,event:"RETURNED",userId:r.user.id,userRole:r.user.roleName,occurredAt:c,metadata:o?{reason:o}:null}),await m({userId:r.user.id,username:r.user.username,action:"RETURN_REPORT",category:"REPORTS",severity:"INFO",resourceType:"report",resourceId:e.toString(),description:`Returned report #${e} to resident for revision${o?": "+o:""}`});const[m$1]=await fe.select().from(_e.worklist).where(eq(_e.worklist.reportId,e)).limit(1);return p.notifyReportStatusChange(e,m$1?.id||null,"IN_PROGRESS","DRAFT"),json({success:!0,report:l,message:"Report returned to resident for revision"})}catch(r){return console.error("Return report error:",r),json({success:false,error:"Failed to return report"},{status:500})}};

export { E as POST };
//# sourceMappingURL=_server.ts-CDUgAhdH.js.map

import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const T=async({request:c,params:p})=>{try{const e=await X(c);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const r=parseInt(p.id);if(isNaN(r))return json({success:!1,error:"Invalid ID"},{status:400});const[i]=await fe.select().from(_e.reports).where(eq(_e.reports.id,r)).limit(1);if(!i)return json({success:!1,error:"Report not found"},{status:404});const l=i.createdBy===e.user.id,w=i.signedBy===e.user.id,f=await J(e.user.id,"reports.review");if(!l&&!w&&!f)return json({success:!1,error:"Permission denied"},{status:403});if(i.status!=="SIGNED")return json({success:!1,error:"Only signed reports can be sent for specialist review"},{status:400});if(i.reviewedBy!==null)return json({success:!1,error:"This report was already reviewed by a specialist"},{status:400});const a=new Date,d=await c.json().catch(()=>({})),m$1=d.specialistId,o=d.message||"",[I]=await fe.update(_e.reports).set({status:"SUBMITTED",assignedSpecialistId:m$1||null,submittedBy:e.user.id,submittedAt:a,updatedAt:a}).where(eq(_e.reports.id,r)).returning();return await fe.insert(_e.reportWorkflows).values({reportId:r,event:"REVIEW_REQUESTED",userId:e.user.id,userRole:e.user.roleName,notes:o||"Sent for specialist co-signature review",metadata:o?{message:o}:null,occurredAt:a}),await fe.update(_e.worklist).set({status:"IN_PROGRESS",updatedAt:a}).where(eq(_e.worklist.reportId,r)),await m({userId:e.user.id,username:e.user.username,action:"REQUEST_REVIEW",category:"REPORTS",severity:"INFO",resourceType:"report",resourceId:r.toString(),description:`Requested specialist review for report #${r}${o?": "+o:""}`}),json({success:!0,report:I,message:"Report sent for specialist review"})}catch(e){return console.error("Request review error:",e),json({success:false,error:"Failed to request review"},{status:500})}};

export { T as POST };
//# sourceMappingURL=_server.ts-CtuJoK8h.js.map

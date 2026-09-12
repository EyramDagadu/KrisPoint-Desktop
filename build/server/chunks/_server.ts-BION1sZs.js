import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import { p } from './getReportIdentifier-D1d75-b1.js';
import { and, eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const v=async({request:c,params:m$1})=>{try{const s=await X(c);if(!s.success||!s.user)return json({success:!1,error:"Unauthorized"},{status:401});const r=parseInt(m$1.id),i=parseInt(m$1.addendumId);if(isNaN(r)||isNaN(i))return json({success:!1,error:"Invalid ID"},{status:400});const[u]=await fe.select().from(_e.reportAmendments).where(and(eq(_e.reportAmendments.id,i),eq(_e.reportAmendments.reportId,r))).limit(1);if(!u)return json({success:!1,error:"Addendum not found"},{status:404});if(u.status!=="DRAFT")return json({success:!1,error:"Only draft addendums can be submitted"},{status:400});if(u.createdBy!==s.user.id)return json({success:!1,error:"Only the addendum creator can submit it"},{status:403});const f=await c.json(),{specialistId:a}=f;if(!a)return json({success:!1,error:"Please select a specialist for review"},{status:400});const[d]=await fe.select({fullName:_e.users.fullName,title:_e.users.title}).from(_e.users).where(eq(_e.users.id,a)).limit(1),p$1=d?d.title?`${d.title} ${d.fullName}`:d.fullName:`specialist #${a}`,b=await p(r),l=new Date,[I]=await fe.update(_e.reportAmendments).set({status:"SUBMITTED",assignedSpecialistId:a,submittedAt:l,updatedAt:l}).where(eq(_e.reportAmendments.id,i)).returning();return await m({userId:s.user.id,username:s.user.username,userRole:s.user.roleName,action:"ADDENDUM_SUBMITTED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(i),description:`Addendum submitted for report #${r} to ${p$1}`,metadata:{reportId:r,specialistId:a}}),json({success:!0,addendum:I,message:"Addendum submitted for review"})}catch(s){return console.error("Error submitting addendum:",s),json({success:false,error:"Failed to submit addendum"},{status:500})}};

export { v as POST };
//# sourceMappingURL=_server.ts-BION1sZs.js.map

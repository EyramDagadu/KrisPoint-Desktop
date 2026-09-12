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

const E=async({request:o,params:u})=>{try{const e=await X(o);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const s=parseInt(u.id),d=parseInt(u.addendumId);if(isNaN(s)||isNaN(d))return json({success:!1,error:"Invalid ID"},{status:400});const[n]=await fe.select().from(_e.reportAmendments).where(and(eq(_e.reportAmendments.id,d),eq(_e.reportAmendments.reportId,s))).limit(1);if(!n)return json({success:!1,error:"Addendum not found"},{status:404});if(n.status!=="SUBMITTED")return json({success:!1,error:"Only submitted addendums can be returned"},{status:400});if(n.assignedSpecialistId!==e.user.id)return json({success:!1,error:"Only the assigned specialist can return this addendum"},{status:403});const c=await o.json(),{feedback:m$1}=c,g=await p(s),p$1=new Date,[f]=await fe.update(_e.reportAmendments).set({status:"DRAFT",submittedAt:null,updatedAt:p$1}).where(eq(_e.reportAmendments.id,d)).returning();return await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"ADDENDUM_RETURNED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(d),description:`Addendum returned for report #${s}`,metadata:{reportId:s,feedback:m$1}}),json({success:!0,addendum:f,message:"Addendum returned to creator for revision"})}catch(e){return console.error("Error returning addendum:",e),json({success:false,error:"Failed to return addendum"},{status:500})}};

export { E as POST };
//# sourceMappingURL=_server.ts-CuXPMCWA.js.map

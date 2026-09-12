import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { p } from './getReportIdentifier-D1d75-b1.js';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const T=async({request:p$1,params:u})=>{try{const e=await X(p$1);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const t=parseInt(u.id),d=parseInt(u.addendumId);if(isNaN(t)||isNaN(d))return json({success:!1,error:"Invalid ID"},{status:400});const[n]=await fe.select().from(_e.reports).where(eq(_e.reports.id,t)).limit(1);if(!n)return json({success:!1,error:"Report not found"},{status:404});const[i]=await fe.select().from(_e.reportAmendments).where(and(eq(_e.reportAmendments.id,d),eq(_e.reportAmendments.reportId,t))).limit(1);if(!i)return json({success:!1,error:"Addendum not found"},{status:404});if(i.status==="SIGNED")return json({success:!1,error:"Addendum is already signed"},{status:400});const c=await J(e.user.id,"reports.sign"),l=await J(e.user.id,"reports.sign_own"),g=!n.reviewedBy||n.reviewedBy===n.signedBy,w=i.createdBy===e.user.id,I=n.signedBy===e.user.id;if(i.status==="DRAFT"){if(!w)return json({success:!1,error:"Only the addendum creator can sign a draft addendum"},{status:403});if(!g&&!I)return json({success:!1,error:"This report was reviewed by a specialist. Please submit the addendum for specialist review."},{status:403});if(!l&&!c)return json({success:!1,error:"Permission denied - requires sign permission"},{status:403})}else if(i.status==="SUBMITTED"){if(i.assignedSpecialistId!==e.user.id)return json({success:!1,error:"Only the assigned specialist can sign this addendum"},{status:403});if(!c)return json({success:!1,error:"Permission denied - requires sign permission"},{status:403})}const N=await p(t),m$1=new Date,[y]=await fe.update(_e.reportAmendments).set({status:"SIGNED",signedBy:e.user.id,signedAt:m$1,updatedAt:m$1}).where(eq(_e.reportAmendments.id,d)).returning();return await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"ADDENDUM_SIGNED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(d),description:`Addendum signed for report #${t}`,metadata:{reportId:t}}),json({success:!0,addendum:y,message:"Addendum signed successfully"})}catch(e){return console.error("Error signing addendum:",e),json({success:false,error:"Failed to sign addendum"},{status:500})}};

export { T as POST };
//# sourceMappingURL=_server.ts-FSPT7D8W.js.map

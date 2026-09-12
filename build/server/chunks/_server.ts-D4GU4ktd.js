import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X, c as J, l as m } from './auth-CFRsUa-j.js';
import { p } from './reportEvents-Ce-jVB2J.js';
import { eq } from 'drizzle-orm';
import { y } from './PatientsRepository-CeQqAz_q.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const D=async({request:p$1,params:c})=>{try{const e=await X(p$1);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});if(!await J(e.user.id,"worklist.pickup"))return json({success:!1,error:"Permission denied"},{status:403});const o=parseInt(c.id);if(isNaN(o))return json({success:!1,error:"Invalid ID"},{status:400});const[r]=await fe.select({id:_e.worklist.id,patientId:_e.worklist.patientId,modality:_e.worklist.modality,bodyRegion:_e.worklist.bodyRegion,accessionNumber:_e.worklist.accessionNumber,studyDate:_e.worklist.studyDate,priority:_e.worklist.priority,indication:_e.worklist.indication,referringPhysician:_e.worklist.referringPhysician,status:_e.worklist.status,patientFirstName:_e.patients.firstName,patientLastName:_e.patients.lastName,patientHospitalNumber:_e.patients.mrn,patientGender:_e.patients.gender,patientDateOfBirth:_e.patients.dateOfBirth}).from(_e.worklist).leftJoin(_e.patients,eq(_e.worklist.patientId,_e.patients.id)).where(eq(_e.worklist.id,o)).limit(1);if(!r)return json({success:!1,error:"Worklist item not found"},{status:404});const i=y.decryptPatientFields(r);if(i.status!=="PENDING")return json({success:!1,error:"This item has already been picked up"},{status:400});const n=new Date,[a]=await fe.insert(_e.reports).values({patientId:r.patientId,accessionNumber:r.accessionNumber,modality:r.modality,bodyRegion:r.bodyRegion,studyDate:r.studyDate,indication:r.indication,status:"DRAFT",priority:r.priority,isFromWorklist:!0,createdBy:e.user.id,openedBy:e.user.id,openedAt:n}).returning();return await fe.insert(_e.reportWorkflows).values({reportId:a.id,event:"OPENED",userId:e.user.id,userRole:e.user.roleName,occurredAt:n}),await fe.update(_e.worklist).set({status:"IN_PROGRESS",reportId:a.id,pickedUpBy:e.user.id,pickedUpAt:n,updatedAt:n}).where(eq(_e.worklist.id,o)),p.notifyReportStatusChange(a.id,o,"IN_PROGRESS","DRAFT"),await m({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"WORKLIST_PICKUP",category:"WORKLIST",severity:"INFO",resourceType:"WORKLIST",resourceId:String(o),description:`Worklist item picked up, report ${a.id} created`,metadata:{reportId:a.id,accessionNumber:r.accessionNumber}}),json({success:!0,reportId:a.id,patientData:{name:`${i.patientFirstName||""} ${i.patientLastName||""}`.trim(),hospitalNumber:i.patientHospitalNumber||"",gender:i.patientGender||"",dateOfBirth:i.patientDateOfBirth||"",examType:i.modality||"",examSubtype:i.bodyRegion||"",indication:i.indication||"",referringPhysician:i.referringPhysician||"",studyDate:i.studyDate?new Date(i.studyDate).toISOString().split("T")[0]:new Date().toISOString().split("T")[0]},message:"Report created from worklist item"})}catch(e){return console.error("Pickup worklist item error:",e),json({success:false,error:"Failed to pick up worklist item"},{status:500})}};

export { D as POST };
//# sourceMappingURL=_server.ts-D4GU4ktd.js.map

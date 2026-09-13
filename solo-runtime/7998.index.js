export const id = 7998;
export const ids = [7998];
export const modules = {

/***/ 65131:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   y: () => (/* binding */ y)
/* harmony export */ });
/* harmony import */ var _db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(32411);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(7002);
/* harmony import */ var _encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(70305);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(76982);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__]);
_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];





function l(e){return (0,crypto__WEBPACK_IMPORTED_MODULE_2__.createHash)("sha256").update(e.toLowerCase().trim()).digest("hex")}function r(e){return {id:e.id,firstName:(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.firstName)||e.firstName,lastName:(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.lastName)||e.lastName,middleName:e.middleName?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.middleName)||e.middleName:null,mrn:(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.mrn)||e.mrn,dateOfBirth:e.dateOfBirth?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.dateOfBirth)||e.dateOfBirth:null,gender:e.gender,phone:e.phone?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.phone)||e.phone:null,email:e.email?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.email)||e.email:null,address:e.address?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.address)||e.address:null,isActive:e.isActive??true,createdBy:e.createdBy,createdAt:e.createdAt,updatedAt:e.updatedAt}}const y={async create(e){const t=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.m)({firstName:e.firstName,lastName:e.lastName,middleName:e.middleName,mrn:e.mrn,dateOfBirth:e.dateOfBirth,phone:e.phone,email:e.email,address:e.address}),[a]=await _db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.d.insert(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients).values({firstName:t.firstName,lastName:t.lastName,middleName:t.middleName,mrn:t.mrn,hashedMrn:l(e.mrn),dateOfBirth:t.dateOfBirth,gender:e.gender,phone:t.phone,email:t.email,address:t.address,createdBy:e.createdBy}).returning();return r(a)},async findByMrn(e){const t=l(e),a=await _db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.d.select().from(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_3__.eq)(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients.hashedMrn,t)).limit(1);return a.length===0?null:r(a[0])},async findById(e){const t=await _db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.d.select().from(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_3__.eq)(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients.id,e)).limit(1);return t.length===0?null:r(t[0])},async update(e,t){const a={updatedAt:new Date};t.firstName!==void 0&&(a.firstName=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.firstName)),t.lastName!==void 0&&(a.lastName=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.lastName)),t.middleName!==void 0&&(a.middleName=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.middleName)),t.dateOfBirth!==void 0&&(a.dateOfBirth=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.dateOfBirth)),t.phone!==void 0&&(a.phone=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.phone)),t.email!==void 0&&(a.email=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.email)),t.address!==void 0&&(a.address=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.address)),t.gender!==void 0&&(a.gender=t.gender),t.mrn!==void 0&&(a.mrn=(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.o)(t.mrn),a.hashedMrn=l(t.mrn));const[f]=await _db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.d.update(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients).set(a).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_3__.eq)(_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_0__.s.patients.id,e)).returning();return f?r(f):null},decryptPatientFields(e){const t={...e,patientFirstName:e.patientFirstName?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.patientFirstName)||e.patientFirstName:null,patientLastName:e.patientLastName?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.patientLastName)||e.patientLastName:null};return "patientHospitalNumber"in e&&(t.patientHospitalNumber=e.patientHospitalNumber?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.patientHospitalNumber)||e.patientHospitalNumber:null),"patientMrn"in e&&(t.patientMrn=e.patientMrn?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.patientMrn)||e.patientMrn:null),"patientDateOfBirth"in e&&(t.patientDateOfBirth=e.patientDateOfBirth?(0,_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_1__.p)(e.patientDateOfBirth)||e.patientDateOfBirth:null),t}};


//# sourceMappingURL=PatientsRepository.js-Q24TN-Ba.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ 37998:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ D)
/* harmony export */ });
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26765);
/* harmony import */ var _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32411);
/* harmony import */ var _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(31981);
/* harmony import */ var _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(80610);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(7002);
/* harmony import */ var _chunks_PatientsRepository_js_Q24TN_Ba_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(65131);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(71621);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(63281);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(99556);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(68668);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(76982);
/* harmony import */ var _chunks_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(70305);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__, _chunks_PatientsRepository_js_Q24TN_Ba_js__WEBPACK_IMPORTED_MODULE_4__]);
([_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__, _chunks_PatientsRepository_js_Q24TN_Ba_js__WEBPACK_IMPORTED_MODULE_4__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);















const D=async({request:p$1,params:c})=>{try{const e=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.a)(p$1);if(!e.success||!e.user)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});if(!await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.c)(e.user.id,"worklist.pickup"))return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied"},{status:403});const o=parseInt(c.id);if(isNaN(o))return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const[r]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.select({id:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.id,patientId:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.patientId,modality:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.modality,bodyRegion:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.bodyRegion,accessionNumber:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.accessionNumber,studyDate:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.studyDate,priority:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.priority,indication:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.indication,referringPhysician:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.referringPhysician,status:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.status,patientFirstName:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients.firstName,patientLastName:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients.lastName,patientHospitalNumber:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients.mrn,patientGender:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients.gender,patientDateOfBirth:_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients.dateOfBirth}).from(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).leftJoin(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients,(0,drizzle_orm__WEBPACK_IMPORTED_MODULE_11__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.patientId,_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.patients.id)).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_11__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.id,o)).limit(1);if(!r)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Worklist item not found"},{status:404});const i=_chunks_PatientsRepository_js_Q24TN_Ba_js__WEBPACK_IMPORTED_MODULE_4__.y.decryptPatientFields(r);if(i.status!=="PENDING")return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"This item has already been picked up"},{status:400});const n=new Date,[a]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).values({patientId:r.patientId,accessionNumber:r.accessionNumber,modality:r.modality,bodyRegion:r.bodyRegion,studyDate:r.studyDate,indication:r.indication,status:"DRAFT",priority:r.priority,isFromWorklist:!0,createdBy:e.user.id,openedBy:e.user.id,openedAt:n}).returning();return await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:a.id,event:"OPENED",userId:e.user.id,userRole:e.user.roleName,occurredAt:n}),await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).set({status:"IN_PROGRESS",reportId:a.id,pickedUpBy:e.user.id,pickedUpAt:n,updatedAt:n}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_11__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.id,o)),_chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(a.id,o,"IN_PROGRESS","DRAFT"),await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:e.user.id,username:e.user.username,userRole:e.user.roleName,action:"WORKLIST_PICKUP",category:"WORKLIST",severity:"INFO",resourceType:"WORKLIST",resourceId:String(o),description:`Worklist item picked up, report ${a.id} created`,metadata:{reportId:a.id,accessionNumber:r.accessionNumber}}),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,reportId:a.id,patientData:{name:`${i.patientFirstName||""} ${i.patientLastName||""}`.trim(),hospitalNumber:i.patientHospitalNumber||"",gender:i.patientGender||"",dateOfBirth:i.patientDateOfBirth||"",examType:i.modality||"",examSubtype:i.bodyRegion||"",indication:i.indication||"",referringPhysician:i.referringPhysician||"",studyDate:i.studyDate?new Date(i.studyDate).toISOString().split("T")[0]:new Date().toISOString().split("T")[0]},message:"Report created from worklist item"})}catch(e){return console.error("Pickup worklist item error:",e),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to pick up worklist item"},{status:500})}};


//# sourceMappingURL=_server.ts.js-Cl30DFGY.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};

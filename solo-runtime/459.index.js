export const id = 459;
export const ids = [459];
export const modules = {

/***/ 459:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GET: () => (/* binding */ v),
/* harmony export */   POST: () => (/* binding */ F)
/* harmony export */ });
/* harmony import */ var _index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(47868);
/* harmony import */ var _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(35892);
/* harmony import */ var _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(64828);
/* harmony import */ var _getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(92934);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(63471);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(39721);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(52874);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(83849);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(36242);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(76982);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__, _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__, _getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__]);
([_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__, _auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__, _getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);












function D(n,a){return n.createdBy===a||n.openedBy===a||n.assignedSpecialistId===a||n.signedBy===a}const v=async({request:n,params:a})=>{try{const r=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(n);if(!r.success||!r.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const s=parseInt(a.id);if(isNaN(s))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid report ID"},{status:400});const[d]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,s)).limit(1);if(!d)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(!await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.c)(r.user.id,"reports.read")&&!D(d,r.user.id))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied - not a participant on this report"},{status:403});const l=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select({id:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.id,reportId:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.reportId,amendmentType:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.amendmentType,reason:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.reason,content:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.content,status:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.status,createdBy:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.createdBy,createdAt:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.createdAt,assignedSpecialistId:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.assignedSpecialistId,submittedAt:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.submittedAt,signedBy:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.signedBy,signedAt:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.signedAt}).from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.reportId,s)).orderBy((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_9__/* .desc */ .i)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments.createdAt)),p=await Promise.all(l.map(async o=>{let f=null,c=null,y=null,g=null;if(o.createdBy){const[i]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select({fullName:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.fullName,title:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.title}).from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.id,o.createdBy)).limit(1);i&&(f=i.fullName,c=i.title);}if(o.signedBy){const[i]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select({fullName:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.fullName,title:_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.title}).from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.users.id,o.signedBy)).limit(1);i&&(y=i.fullName,g=i.title);}return {...o,creatorName:f,creatorTitle:c,signerName:y,signerTitle:g}}));return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,addendums:p})}catch(r){return console.error("Error fetching addendums:",r),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to fetch addendums"},{status:500})}},F=async({request:n,params:a})=>{try{const r=await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.v)(n);if(!r.success||!r.user)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});const s=parseInt(a.id);if(isNaN(s))return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid report ID"},{status:400});const[d]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_8__.eq)(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,s)).limit(1);if(!d)return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(d.status!=="SIGNED")return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Addendums can only be added to signed reports"},{status:400});if(!D(d,r.user.id))return await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:r.user.id,username:r.user.username,userRole:r.user.roleName,action:"ADDENDUM_CREATE_DENIED",category:"REPORTS",severity:"WARNING",resourceType:"REPORT",resourceId:String(s),description:"User not authorized to add addendum - not a participant on this report"}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the original report creator or assigned specialist can add addendums"},{status:403});const A=await n.json(),{reason:l,content:p$1,amendmentType:o="ADDENDUM"}=A;if(!l?.trim())return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Reason is required"},{status:400});if(!p$1?.trim())return (0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Content is required"},{status:400});const f=await (0,_getReportIdentifier_DBWnsoia_js__WEBPACK_IMPORTED_MODULE_3__.p)(s),[c]=await _db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_db_Bs2j9Ox_js__WEBPACK_IMPORTED_MODULE_1__.s.reportAmendments).values({reportId:s,amendmentType:o,reason:l.trim(),content:p$1.trim(),status:"DRAFT",createdBy:r.user.id,createdAt:new Date,updatedAt:new Date}).returning();return await (0,_auth_BFFUBPoh_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:r.user.id,username:r.user.username,userRole:r.user.roleName,action:"ADDENDUM_CREATED",category:"REPORTS",severity:"INFO",resourceType:"ADDENDUM",resourceId:String(c.id),description:`Addendum created for report #${s}`,metadata:{reportId:s,amendmentType:o}}),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,addendum:c,message:"Addendum created successfully"},{status:201})}catch(r){return console.error("Error creating addendum:",r),(0,_index_Djsj11qr_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to create addendum"},{status:500})}};


//# sourceMappingURL=_server.ts-B1naAFGJ.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};

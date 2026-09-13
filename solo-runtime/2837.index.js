export const id = 2837;
export const ids = [2837];
export const modules = {

/***/ 52837:
/***/ ((__webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(__webpack_module__, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   POST: () => (/* binding */ E)
/* harmony export */ });
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(26765);
/* harmony import */ var _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(32411);
/* harmony import */ var _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(31981);
/* harmony import */ var _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(80610);
/* harmony import */ var drizzle_orm__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(7002);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(71621);
/* harmony import */ var dotenv_config__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(63281);
/* harmony import */ var pg__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(99556);
/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(68668);
/* harmony import */ var crypto__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(76982);
/* harmony import */ var _chunks_encryption_js_e_FMoLY3_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(70305);
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__]);
([_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__, _chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);














const E=async({request:u$1,params:d})=>{try{const r=await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.a)(u$1);if(!r.success||!r.user)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Unauthorized"},{status:401});if(!await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.c)(r.user.id,"reports.review"))return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Permission denied"},{status:403});const e=parseInt(d.id);if(isNaN(e))return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Invalid ID"},{status:400});const p$1=await u$1.json(),{reason:o}=p$1,[i]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,e)).limit(1);if(!i)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Report not found"},{status:404});if(i.status!=="SUBMITTED")return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Can only return reports that are submitted for review"},{status:400});if(i.assignedSpecialistId!==r.user.id)return (0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!1,error:"Only the assigned specialist can return this report"},{status:403});const c=new Date,[l]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.update(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports).set({status:"DRAFT",assignedSpecialistId:null,updatedAt:c}).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reports.id,e)).returning();await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.insert(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.reportWorkflows).values({reportId:e,event:"RETURNED",userId:r.user.id,userRole:r.user.roleName,occurredAt:c,metadata:o?{reason:o}:null}),await (0,_chunks_auth_js_BEnDHOh1_js__WEBPACK_IMPORTED_MODULE_2__.l)({userId:r.user.id,username:r.user.username,action:"RETURN_REPORT",category:"REPORTS",severity:"INFO",resourceType:"report",resourceId:e.toString(),description:`Returned report #${e} to resident for revision${o?": "+o:""}`});const[m]=await _chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.d.select().from(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist).where((0,drizzle_orm__WEBPACK_IMPORTED_MODULE_10__.eq)(_chunks_db_js_Cln6ZScl_js__WEBPACK_IMPORTED_MODULE_1__.s.worklist.reportId,e)).limit(1);return _chunks_reportEvents_js_Ce_jVB2J_js__WEBPACK_IMPORTED_MODULE_3__.p.notifyReportStatusChange(e,m?.id||null,"IN_PROGRESS","DRAFT"),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:!0,report:l,message:"Report returned to resident for revision"})}catch(r){return console.error("Return report error:",r),(0,_chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_0__.j)({success:false,error:"Failed to return report"},{status:500})}};


//# sourceMappingURL=_server.ts.js-BwlRmbDs.js.map

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

};

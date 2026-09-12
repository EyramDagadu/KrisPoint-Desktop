export const id = 1651;
export const ids = [1651];
export const modules = {

/***/ 89000:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _: () => (/* binding */ _)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


function _(e,l){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();let a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(l.startDate,""),r=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(l.endDate,""),s=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(l.selectedPreset,"all");const i=[{value:"all",label:"All Time"},{value:"today",label:"Today"},{value:"7days",label:"Last 7 Days"},{value:"30days",label:"Last 30 Days"},{value:"3months",label:"Past 3 Months"},{value:"year",label:"Past Year"},{value:"custom-day",label:"Custom Day"},{value:"custom-range",label:"Custom Range"}];function h(){return s==="custom-day"&&a?n(a):s==="custom-range"&&a&&r?`${n(a)} - ${n(r)}`:i.find(u=>u.value===s)?.label||"All Time"}function n(t){return t?new Date(t).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):""}h();const v=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(i);e.out.push('<div class="date-filter-dropdown svelte-hd729a"><select class="preset-select svelte-hd729a">'),e.select_value=s,e.out.push("<!--[-->");for(let t=0,u=v.length;t<u;t++){let o=v[t];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",o.value)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,o.value)} class="svelte-hd729a">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o.label)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push("</select> "),e.out.push("<!--[!-->"),e.out.push("<!--]--></div>"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(l,{startDate:a,endDate:r,selectedPreset:s}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=DateFilterDropdown-CmsvNQjW.js.map


/***/ }),

/***/ 26421:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t: () => (/* binding */ t)
/* harmony export */ });
let o=new Map;const t={register(e,n){this.unregister(e),o.set(e,n),console.log(`[SSE] Registered connection: ${e}, total: ${o.size}`);},unregister(e){const n=o.get(e);n&&(n.close(),o.delete(e),console.log(`[SSE] Unregistered connection: ${e}, total: ${o.size}`));},closeAll(){console.log(`[SSE] Closing all ${o.size} connections`),o.forEach((e,n)=>{try{e.close(),console.log(`[SSE] Closed connection: ${n}`);}catch(s){console.error(`[SSE] Error closing ${n}:`,s);}}),o.clear();},getCount(){return o.size}};


//# sourceMappingURL=SSEManager-DiJ-NMik.js.map


/***/ }),

/***/ 21651:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ q)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(83230);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(25781);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(88609);
/* harmony import */ var _reportStore_Dprca8ZA_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(17528);
/* harmony import */ var _DateFilterDropdown_CmsvNQjW_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(89000);
/* harmony import */ var _SSEManager_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(26421);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(72912);










function q(e$1,R){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var u;let h$1;const S="worklist-reports";let f=[],g="",D="ALL",v="ALL",p="",L="",w="",z="all";const T=[{value:"ALL",label:"All Priorities"},{value:"STAT",label:"STAT"},{value:"URGENT",label:"Urgent"},{value:"ROUTINE",label:"Routine"}],k=[{value:"ALL",label:"All Statuses"},{value:"PENDING",label:"Pending"},{value:"DRAFT",label:"Draft"},{value:"SUBMITTED",label:"Submitted"},{value:"SIGNED",label:"Signed Off"}];let A=[...["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"]];new Date().toISOString().split("T")[0],(0,_index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__.e)(()=>{_SSEManager_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_7__.t.unregister(S);}),h$1=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(u??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__.h).includes("worklist.create"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(u??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__.h).includes("worklist.pickup"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(u??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__.h).includes("worklist.update"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(u??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_4__.h).includes("worklist.delete"),f.filter(t=>{const r=p.toLowerCase().trim();return (!r||`${t.patientFirstName||""} ${t.patientLastName||""}`.toLowerCase().includes(r)||(t.patientHospitalNumber||"").toLowerCase().includes(r))&&true&&v==="ALL"});const m=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(k),b=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(T),_$1=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(A);e$1.out.push(`<div class="worklist-page svelte-rs9z6b"><div class="page-header svelte-rs9z6b"><div class="header-actions svelte-rs9z6b"><input type="text" class="search-input svelte-rs9z6b" placeholder="Search patient name or hospital no..."${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",p)}/> `),(0,_DateFilterDropdown_CmsvNQjW_js__WEBPACK_IMPORTED_MODULE_6__._)(e$1,{startDate:L,endDate:w,selectedPreset:z}),e$1.out.push('<!----> <select class="status-filter svelte-rs9z6b">'),e$1.select_value=D,e$1.out.push("<!--[-->");for(let t=0,r=m.length;t<r;t++){let s=m[t];e$1.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",s.value)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,s.value)} class="svelte-rs9z6b">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(s.label)}</option>`);}e$1.out.push("<!--]-->"),e$1.select_value=void 0,e$1.out.push('</select> <select class="priority-filter svelte-rs9z6b">'),e$1.select_value=v,e$1.out.push("<!--[-->");for(let t=0,r=b.length;t<r;t++){let s=b[t];e$1.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",s.value)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,s.value)} class="svelte-rs9z6b">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(s.label)}</option>`);}e$1.out.push("<!--]-->"),e$1.select_value=void 0,e$1.out.push('</select> <select class="modality-filter svelte-rs9z6b">'),e$1.select_value=g,e$1.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,"")} class="svelte-rs9z6b">All Modalities</option><!--[-->`);for(let t=0,r=_$1.length;t<r;t++){let s=_$1[t];e$1.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",s)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e$1,s)} class="svelte-rs9z6b">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(s)}</option>`);}e$1.out.push("<!--]-->"),e$1.select_value=void 0,e$1.out.push("</select> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),h$1?(e$1.out.push("<!--[-->"),e$1.out.push('<button class="btn-primary svelte-rs9z6b">+ Add Patient</button>')):e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--></div></div> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),e$1.out.push("<!--[-->"),e$1.out.push('<div class="loading svelte-rs9z6b">Loading worklist...</div>'),e$1.out.push("<!--]--></div> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]-->"),u&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(u),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-DWcTA4hI.js.map


/***/ }),

/***/ 88609:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   e: () => (/* binding */ e),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   h: () => (/* binding */ h),
/* harmony export */   l: () => (/* binding */ l),
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72912);


const n={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function i(){const{subscribe:t,set:a,update:c}=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(n);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){a(n);}}}const d=i(),o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},e=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(o),l=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.isAuthenticated),p=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.currentUser),h=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.permissions);(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.error);const f=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(e,t=>t.isLoading);


//# sourceMappingURL=authStore-_wTOTagk.js.map


/***/ }),

/***/ 83230:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   e: () => (/* binding */ e)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


function e(o){var t=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.w;(t.d??=[]).push(o);}


//# sourceMappingURL=index-server-B0jzk0X3.js.map


/***/ }),

/***/ 17528:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   C: () => (/* binding */ C),
/* harmony export */   D: () => (/* binding */ D),
/* harmony export */   S: () => (/* binding */ S),
/* harmony export */   a: () => (/* binding */ a),
/* harmony export */   b: () => (/* binding */ b),
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   v: () => (/* binding */ v)
/* harmony export */ });
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72912);
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(98579);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(88609);




const D=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_1__.s;function O(t){if(!t)return "";let e=t,i;do i=e.length,e=e.replace(/(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*){2,}/gi,"<p></p>");while(e.length!==i);return e=e.replace(/^(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+/gi,""),e=e.replace(/(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+$/gi,""),e.trim()}const g={name:"",firstName:"",lastName:"",hospitalNumber:"",age:"",ageUnit:"years",dateOfBirth:"",gender:"",examType:"",examSubtype:"",indication:"",referringPhysician:"",studyDate:new Date().toISOString().split("T")[0],accessionNumber:"",priority:"ROUTINE",specialistName:"",specialistDesignation:"Radiologist"};function T(){const{subscribe:t,set:e,update:i}=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(g);return {subscribe:t,set:e,update:i,reset:()=>{e({...g,studyDate:new Date().toISOString().split("T")[0]});}}}const S=T(),h={content:"",reportId:null,databaseReportId:null,lastModified:null,isDirty:false,status:"DRAFT",lastSaved:null,finalizedAt:null,assignedSpecialistId:null,createdBy:null,creatorInfo:null,signerInfo:null,reviewerInfo:null,signedBy:null,signedAt:null,reviewedBy:null},a=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(h);(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(a,t=>t.status||"DRAFT");const w={isOwner:false,isAssignedSpecialist:false,isSigner:false,isReviewer:false,hasSpecialistReview:false,hasBeenSubmitted:false,currentUserId:null,canUndoSign:false,undoSignExpiresAt:null,isReportAuthor:false},u=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(w),v=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)([a,u],([t,e])=>{const i=t.status||"DRAFT",s=e.isOwner,n=e.isAssignedSpecialist,o=e.isSigner,r=e.isReviewer,c=e.canUndoSign,p=e.undoSignExpiresAt;let l=false;return i==="SIGNED"?l=true:i==="SUBMITTED"?l=!n:i==="DRAFT"&&(l=!s),{readOnly:l,isOwner:s,isAssignedSpecialist:n,isSigner:o,isReviewer:r,hasSpecialistReview:e.hasSpecialistReview,hasBeenSubmitted:e.hasBeenSubmitted,canUndoSign:c,undoSignExpiresAt:p,status:i}}),R={isListening:false,showMacroPanel:false,showVoiceWave:false,isReportStarted:false,sidebarCollapsed:true,lastCommand:null,errors:[],showPatientModal:false,notification:null,activeSection:"comparison"},d=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(R);(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(S,t=>t.name&&t.hospitalNumber&&t.examType&&t.examSubtype);const C={updateContent(t){a.update(e=>({...e,content:t,lastModified:new Date().toISOString(),isDirty:true}));},setDatabaseReportId(t,e=null){a.update(i=>({...i,databaseReportId:t,lastSaved:e||new Date().toISOString(),lastModified:e||new Date().toISOString()}));},setReportStatus(t){a.update(e=>({...e,status:t}));},setAssignedSpecialistId(t){a.update(e=>({...e,assignedSpecialistId:t}));},setReportMeta(t){u.update(e=>({...e,...t}));},resetReportMeta(){u.set(w);},appendContent(t){a.update(e=>({...e,content:(e.content||"")+(e.content?`

`:"")+t,lastModified:new Date().toISOString(),isDirty:true}));},insertMacro(t){a.update(e=>({...e,content:(e.content||"")+(e.content?`

`:"")+t,lastModified:new Date().toISOString(),isDirty:true}));},clearContent(){a.update(t=>({...t,content:"",lastModified:new Date().toISOString(),isDirty:true}));},newReport(){let t="",e=g;a.set({content:t,reportId:null,lastModified:new Date().toISOString(),isDirty:false,status:"draft",lastSaved:null,finalizedAt:null}),S.set(e),d.update(i=>({...i,isReportStarted:false}));},clearReport(){a.set({...h,lastModified:null,lastSaved:null}),S.set({...g,studyDate:new Date().toISOString().split("T")[0]}),u.set({...w,isOwner:true});},async loadFromStorage(t){if(!t)return console.warn("No report ID provided for loading"),null;try{const e=await fetch(`/api/reports?id=${t}`,{method:"GET",credentials:"include",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error("Failed to fetch report from database");const i=await e.json();if(i.success&&i.report){const s=i.report;let n=s.content||"";if(!n){const o=[];s.technique&&o.push(`TECHNIQUE:
${s.technique}`),s.comparison&&o.push(`COMPARISON:
${s.comparison}`),s.findings&&o.push(`FINDINGS:
${s.findings}`),s.impressions&&o.push(`IMPRESSION:
${s.impressions}`),s.recommendations&&o.push(`RECOMMENDATIONS:
${s.recommendations}`),n=o.join(`

`);}return n=O(n),a.set({content:n,databaseReportId:s.id,reportId:t,lastModified:s.updatedAt||new Date().toISOString(),isDirty:!1,status:s.status||"DRAFT",lastSaved:s.updatedAt||null,finalizedAt:s.status==="SIGNED"?s.updatedAt:null,assignedSpecialistId:s.assignedSpecialistId||null,createdBy:s.createdBy||null,creatorInfo:s.creatorInfo||null,signerInfo:s.signerInfo||null,reviewerInfo:s.reviewerInfo||null,signedBy:s.signedBy||null,signedAt:s.signedAt||null,reviewedBy:s.reviewedBy||null}),S.set({name:s.patientData?.name||"",hospitalNumber:s.patientData?.hospitalNumber||"",age:s.patientAge||s.patientData?.age||"",ageUnit:s.patientAgeUnit||s.patientData?.ageUnit||"years",dateOfBirth:s.patientData?.dateOfBirth||"",gender:s.patientData?.gender||"",examType:s.patientData?.examType||s.modality||"",examSubtype:s.patientData?.examSubtype||s.bodyRegion||"",indication:s.patientData?.indication||"",referringPhysician:s.patientData?.referringPhysician||"",studyDate:s.patientData?.studyDate||new Date().toISOString().split("T")[0],accessionNumber:s.accessionNumber||"",specialistName:"",specialistDesignation:"Radiologist"}),u.set({isOwner:s.isOwner||!1,isAssignedSpecialist:s.isAssignedSpecialist||!1,isSigner:s.isSigner||!1,isReviewer:s.isReviewer||!1,hasSpecialistReview:!!s.reviewedBy,currentUserId:null,canUndoSign:s.canUndoSign||!1,undoSignExpiresAt:s.undoSignExpiresAt||null}),console.log("Report loaded successfully from database:",t,"isOwner:",s.isOwner),{success:!0,data:{report:s}}}else throw new Error("Failed to load report data")}catch(e){return console.error("Error loading report from database:",e),d.update(i=>({...i,notification:{type:"error",message:`Failed to load report: ${e.message}`,timestamp:Date.now()}})),null}},async saveToStorage(){try{const t=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(a),e=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(S);return console.warn("No session token, cannot save to database"),!1}catch(t){return console.error("Failed to save report:",t),false}},async createReportInDatabase(t,e){try{const i=e.hospitalNumber?.trim();if(!i||i.startsWith("TMP-"))return console.log("Skipping database create: missing or invalid hospital number. Use the patient form to enter proper patient info."),!1;const s=e.firstName?.trim(),n=e.lastName?.trim(),o=e.name?.trim();if(!o&&!s&&!n)return console.log("Skipping database create: missing patient name"),!1;const r=this.parseContentToFields(t.content||""),c={patientName:o||`${s||""} ${n||""}`.trim()||"Unknown Patient",hospitalNumber:i,gender:e.gender||null,dateOfBirth:e.dateOfBirth||null,age:e.age||null,ageUnit:e.ageUnit||"years",modality:e.examType||"OTHER",bodyRegion:e.examSubtype||null,studyDate:e.studyDate||new Date().toISOString().split("T")[0],indication:e.indication||"",content:t.content||"",technique:r.technique,comparison:r.comparison,findings:r.findings,impressions:r.impressions,recommendations:r.recommendations,status:t.status==="finalized"?"SIGNED":"DRAFT"};console.log("Creating new report in database with payload:",c);const p=await fetch("/api/reports",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)});if(!p.ok){const I=await p.text();return console.error("Database create failed:",I),!1}const l=await p.json();return l.success&&l.report?.id?(a.update(I=>({...I,databaseReportId:l.report.id})),console.log("New report created in database with ID:",l.report.id),!0):!1}catch(i){return console.error("Error creating report in database:",i),false}},async saveToDatabase(t,e){try{const i=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(u),s=(t.status||"DRAFT").toUpperCase(),n=i.isOwner,o=i.isAssignedSpecialist;if(s==="SIGNED")return console.log("Skipping save: SIGNED reports are read-only"),!0;if(s==="SUBMITTED"){if(!o)return console.log("Skipping save: SUBMITTED report - not assigned specialist"),!0;console.log("Allowing save for SUBMITTED report: is assigned specialist");}if(s==="DRAFT"){if(!n)return console.log("Skipping save: DRAFT report - not owner"),!0;console.log("Allowing save for DRAFT report: is owner");}const r={content:t.content||"",ifMatchVersion:t.lastSaved||t.lastModified};e.indication?.trim()&&(r.indication=e.indication),e.age&&e.age!==""&&(r.age=e.age,r.ageUnit=e.ageUnit||"years"),e.examSubtype?.trim()&&(r.bodyRegion=e.examSubtype),e.examType?.trim()&&(r.modality=e.examType),e.referringPhysician?.trim()&&(r.referringPhysician=e.referringPhysician);const c=await fetch(`/api/reports?id=${t.databaseReportId}`,{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});if(!c.ok){const l=await c.json().catch(()=>({error:"Unknown error"}));return console.error("Database save failed:",l),!1}const p=await c.json();return p.success&&p.report?.updatedAt&&a.update(l=>({...l,lastSaved:p.report.updatedAt,lastModified:p.report.updatedAt})),p.success}catch(i){return console.error("Error saving to database:",i),false}},parseContentToFields(t){const e={technique:"",comparison:"",findings:"",impressions:"",recommendations:""};if(!t)return e;const i=t.replace(/<br\s*\/?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim(),s=[{key:"technique",pattern:/TECHNIQUE:\s*([\s\S]*?)(?=(?:COMPARISON:|FINDINGS:|IMPRESSION:|RECOMMENDATIONS:|$))/i},{key:"comparison",pattern:/COMPARISON:\s*([\s\S]*?)(?=(?:TECHNIQUE:|FINDINGS:|IMPRESSION:|RECOMMENDATIONS:|$))/i},{key:"findings",pattern:/FINDINGS:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|IMPRESSION:|RECOMMENDATIONS:|$))/i},{key:"impressions",pattern:/IMPRESSION:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|FINDINGS:|RECOMMENDATIONS:|$))/i},{key:"recommendations",pattern:/RECOMMENDATIONS:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|FINDINGS:|IMPRESSION:|$))/i}];for(const{key:o,pattern:r}of s){const c=i.match(r);c&&c[1]&&(e[o]=c[1].trim());}return !Object.values(e).some(o=>o.trim()!=="")&&i.trim()&&(e.findings=i.trim()),e},async saveDraft(){const t=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(a),e=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(u),i=(t.status||"DRAFT").toUpperCase();if(i==="SIGNED")return console.log("Skipping saveDraft: SIGNED reports are read-only"),a.update(n=>({...n,isDirty:false})),true;if(i==="SUBMITTED"){if(!e.isAssignedSpecialist)return console.log("Skipping saveDraft: SUBMITTED report - not assigned specialist"),a.update(o=>({...o,isDirty:false})),true;const n=await this.saveToStorage();return n&&a.update(o=>({...o,isDirty:false,lastSaved:new Date().toISOString()})),n}if(i==="DRAFT"&&!e.isOwner)return console.log("Skipping saveDraft: DRAFT report - not owner"),a.update(n=>({...n,isDirty:false})),true;a.update(n=>({...n,status:n.status==="finalized"?"finalized":"DRAFT",isDirty:true}));const s=await this.saveToStorage();return s&&a.update(n=>({...n,isDirty:false,lastSaved:new Date().toISOString()})),s},async finalizeReport(){a.update(e=>({...e,status:"finalized",finalizedAt:new Date().toISOString(),isDirty:true}));const t=await this.saveToStorage();return t&&a.update(e=>({...e,isDirty:false,lastSaved:new Date().toISOString()})),t},reset(){a.set(h);},save(){return this.saveDraft()},updateSection(t,e){const i={comparison:"COMPARISON:",technique:"TECHNIQUE:",findings:"FINDINGS:",impression:"IMPRESSION:"},s=i[t]?`${i[t]}
${e}

`:e;this.appendContent(s);}},b={setListening(t){d.update(e=>({...e,isListening:t}));},toggleMacroPanel(){d.update(t=>({...t,showMacroPanel:!t.showMacroPanel}));},showMacroPanel(){d.update(t=>({...t,showMacroPanel:true}));},hideMacroPanel(){d.update(t=>({...t,showMacroPanel:false}));},showPatientModal(){d.update(t=>({...t,showPatientModal:true}));},hidePatientModal(){d.update(t=>({...t,showPatientModal:false}));},toggleSidebar(){d.update(t=>({...t,sidebarCollapsed:!t.sidebarCollapsed}));},recordCommand(t){d.update(e=>({...e,lastCommand:t}));},showNotification(t,e){d.update(i=>({...i,notification:{type:t,message:e,timestamp:Date.now()}})),setTimeout(()=>{b.hideNotification();},4e3);},hideNotification(){d.update(t=>({...t,notification:null}));},showSuccessNotification(t){this.showNotification("success",t);},showErrorNotification(t){this.showNotification("error",t);},showInfoNotification(t){this.showNotification("info",t);},setCurrentSection(t){d.update(e=>({...e,activeSection:t})),console.log(`Current section updated to: ${t}`);}};


//# sourceMappingURL=reportStore-Dprca8ZA.js.map


/***/ }),

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ })

};

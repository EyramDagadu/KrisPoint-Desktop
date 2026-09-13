export const id = 8450;
export const ids = [8450];
export const modules = {

/***/ 32657:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89831);



function w(h,u){h.component(a=>{let t=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.startDate,""),o=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.endDate,""),l=(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.M)(u.selectedPreset,"all");const r=[{value:"all",label:"All Time"},{value:"today",label:"Today"},{value:"7days",label:"Last 7 Days"},{value:"30days",label:"Last 30 Days"},{value:"3months",label:"Past 3 Months"},{value:"year",label:"Past Year"},{value:"custom-day",label:"Custom Day"},{value:"custom-range",label:"Custom Range"}];function p(){return l==="custom-day"&&t?n(t):l==="custom-range"&&t&&o?`${n(t)} - ${n(o)}`:r.find(s=>s.value===l)?.label||"All Time"}function n(e){return e?new Date(e).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}):""}p(),a.push('<div class="date-filter-dropdown svelte-mw7fh5">'),a.select({class:"preset-select",value:l},e=>{e.push("<!--[-->");const s=(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a9)(r);for(let i=0,f=s.length;i<f;i++){let m=s[i];e.option({value:m.value,class:""},v=>{v.push(`${(0,_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_1__.P)(m.label)}`);},"svelte-mw7fh5");}e.push("<!--]-->");},"svelte-mw7fh5"),a.push(" "),a.push("<!--[-1-->"),a.push("<!--]--></div>"),(0,_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a5)(u,{startDate:t,endDate:o,selectedPreset:l});});}


//# sourceMappingURL=DateFilterDropdown.js-Cczn1uce.js.map


/***/ }),

/***/ 39777:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   t: () => (/* binding */ t)
/* harmony export */ });
let o=new Map;const t={register(e,n){this.unregister(e),o.set(e,n),console.log(`[SSE] Registered connection: ${e}, total: ${o.size}`);},unregister(e){const n=o.get(e);n&&(n.close(),o.delete(e),console.log(`[SSE] Unregistered connection: ${e}, total: ${o.size}`));},closeAll(){console.log(`[SSE] Closing all ${o.size} connections`),o.forEach((e,n)=>{try{e.close(),console.log(`[SSE] Closed connection: ${n}`);}catch(s){console.error(`[SSE] Error closing ${n}:`,s);}}),o.clear();},getCount(){return o.size}};


//# sourceMappingURL=SSEManager.js-DiJ-NMik.js.map


/***/ }),

/***/ 40298:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   e: () => (/* binding */ e),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   h: () => (/* binding */ h),
/* harmony export */   l: () => (/* binding */ l),
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12144);


const n={pendingReviews:0,returnedReports:0,loading:false,lastFetched:null};function i(){const{subscribe:t,set:a,update:c}=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(n);return {subscribe:t,async loadCounts(){},async refreshAfterAction(){await this.loadCounts();},reset(){a(n);}}}const d=i(),o={isAuthenticated:false,currentUser:null,permissions:[],isLoading:false,error:null},e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(o),l=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.isAuthenticated),p=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.currentUser),h=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.permissions);(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.error);const f=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(e,t=>t.isLoading);


//# sourceMappingURL=authStore.js-Bl2ko8Kh.js.map


/***/ }),

/***/ 50152:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   n: () => (/* binding */ n)
/* harmony export */ });
/* harmony import */ var _index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);


function n(o){_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a2.r.on_destroy(o);}


//# sourceMappingURL=index-server.js-DHhxyrTW.js.map


/***/ }),

/***/ 22312:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   M: () => (/* binding */ M),
/* harmony export */   d: () => (/* binding */ d),
/* harmony export */   n: () => (/* binding */ n),
/* harmony export */   v: () => (/* binding */ v)
/* harmony export */ });
/* harmony import */ var _index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(12144);
/* harmony import */ var _authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(40298);



function T(t){if(!t)return "";let e=t,s;do s=e.length,e=e.replace(/(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*){2,}/gi,"<p></p>");while(e.length!==s);return e=e.replace(/^(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+/gi,""),e=e.replace(/(<p>(<br\s*\/?>|&nbsp;|\s)*<\/p>\s*)+$/gi,""),e.trim()}const m={name:"",firstName:"",lastName:"",hospitalNumber:"",age:"",ageUnit:"years",dateOfBirth:"",gender:"",examType:"",examSubtype:"",indication:"",referringPhysician:"",studyDate:new Date().toISOString().split("T")[0],accessionNumber:"",priority:"ROUTINE",specialistName:"",specialistDesignation:"Radiologist"};function D(){const{subscribe:t,set:e,update:s}=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(m);return {subscribe:t,set:e,update:s,reset:()=>{e({...m,studyDate:new Date().toISOString().split("T")[0]});}}}const S=D(),g={content:"",activeTemplateId:null,activeTemplateName:null,reportId:null,databaseReportId:null,lastModified:null,isDirty:false,status:"DRAFT",lastSaved:null,finalizedAt:null,assignedSpecialistId:null,createdBy:null,creatorInfo:null,signerInfo:null,reviewerInfo:null,signedBy:null,signedAt:null,reviewedBy:null},n=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(g);(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(n,t=>t.status||"DRAFT");const w={isOwner:false,isAssignedSpecialist:false,isSigner:false,isReviewer:false,hasSpecialistReview:false,hasBeenSubmitted:false,currentUserId:null,canUndoSign:false,undoSignExpiresAt:null,isReportAuthor:false},u=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(w);(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)([n,u],([t,e])=>{const s=t.status||"DRAFT",i=e.isOwner,a=e.isAssignedSpecialist,o=e.isSigner,r=e.isReviewer,c=e.canUndoSign,p=e.undoSignExpiresAt;let l=false;return s==="SIGNED"?l=true:s==="SUBMITTED"?l=!a:s==="DRAFT"&&(l=!i),{readOnly:l,isOwner:i,isAssignedSpecialist:a,isSigner:o,isReviewer:r,hasSpecialistReview:e.hasSpecialistReview,hasBeenSubmitted:e.hasBeenSubmitted,canUndoSign:c,undoSignExpiresAt:p,status:s}});const O={isListening:false,showMacroPanel:false,showVoiceWave:false,isReportStarted:false,sidebarCollapsed:true,lastCommand:null,errors:[],showPatientModal:false,notification:null,activeSection:"comparison"},d=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.z)(O);(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.B)(S,t=>t.name&&t.hospitalNumber&&t.examType&&t.examSubtype);const M={updateContent(t){n.update(e=>({...e,content:t,lastModified:new Date().toISOString(),isDirty:true}));},setActiveTemplate(t){n.update(e=>({...e,activeTemplateId:t?.id??null,activeTemplateName:t?.name??null,isDirty:true,lastModified:new Date().toISOString()}));},setDatabaseReportId(t,e=null){n.update(s=>({...s,databaseReportId:t,lastSaved:e||new Date().toISOString(),lastModified:e||new Date().toISOString()}));},setReportStatus(t){n.update(e=>({...e,status:t}));},setAssignedSpecialistId(t){n.update(e=>({...e,assignedSpecialistId:t}));},setReportMeta(t){u.update(e=>({...e,...t}));},resetReportMeta(){u.set(w);},appendContent(t){n.update(e=>({...e,content:(e.content||"")+(e.content?`

`:"")+t,lastModified:new Date().toISOString(),isDirty:true}));},insertMacro(t){n.update(e=>({...e,content:(e.content||"")+(e.content?`

`:"")+t,lastModified:new Date().toISOString(),isDirty:true}));},clearContent(){n.update(t=>({...t,content:"",lastModified:new Date().toISOString(),isDirty:true}));},newReport(){let t="",e=m;n.set({...g,content:t,reportId:null,lastModified:new Date().toISOString(),isDirty:false,status:"draft",lastSaved:null,finalizedAt:null}),S.set(e),d.update(s=>({...s,isReportStarted:false}));},clearReport(){n.set({...g,lastModified:null,lastSaved:null}),S.set({...m,studyDate:new Date().toISOString().split("T")[0]}),u.set({...w,isOwner:true});},async loadFromStorage(t){if(!t)return console.warn("No report ID provided for loading"),null;try{const e=await fetch(`/api/reports?id=${t}`,{method:"GET",credentials:"include",headers:{"Content-Type":"application/json"}});if(!e.ok)throw new Error("Failed to fetch report from database");const s=await e.json();if(s.success&&s.report){const i=s.report;let a=i.content||"";if(!a){const o=[];i.technique&&o.push(`TECHNIQUE:
${i.technique}`),i.comparison&&o.push(`COMPARISON:
${i.comparison}`),i.findings&&o.push(`FINDINGS:
${i.findings}`),i.impressions&&o.push(`IMPRESSION:
${i.impressions}`),i.recommendations&&o.push(`RECOMMENDATIONS:
${i.recommendations}`),a=o.join(`

`);}return a=T(a),n.set({content:a,databaseReportId:i.id,reportId:t,lastModified:i.updatedAt||new Date().toISOString(),isDirty:!1,status:i.status||"DRAFT",activeTemplateId:i.activeTemplateId??null,activeTemplateName:i.activeTemplateName??null,lastSaved:i.updatedAt||null,finalizedAt:i.status==="SIGNED"?i.updatedAt:null,assignedSpecialistId:i.assignedSpecialistId||null,createdBy:i.createdBy||null,creatorInfo:i.creatorInfo||null,signerInfo:i.signerInfo||null,reviewerInfo:i.reviewerInfo||null,signedBy:i.signedBy||null,signedAt:i.signedAt||null,reviewedBy:i.reviewedBy||null}),S.set({name:i.patientData?.name||"",hospitalNumber:i.patientData?.hospitalNumber||"",age:i.patientAge||i.patientData?.age||"",ageUnit:i.patientAgeUnit||i.patientData?.ageUnit||"years",dateOfBirth:i.patientData?.dateOfBirth||"",gender:i.patientData?.gender||"",examType:i.patientData?.examType||i.modality||"",examSubtype:i.patientData?.examSubtype||i.bodyRegion||"",indication:i.patientData?.indication||"",referringPhysician:i.patientData?.referringPhysician||"",studyDate:i.patientData?.studyDate||new Date().toISOString().split("T")[0],accessionNumber:i.accessionNumber||"",specialistName:"",specialistDesignation:"Radiologist"}),u.set({isOwner:i.isOwner||!1,isAssignedSpecialist:i.isAssignedSpecialist||!1,isSigner:i.isSigner||!1,isReviewer:i.isReviewer||!1,hasSpecialistReview:!!i.reviewedBy,currentUserId:null,canUndoSign:i.canUndoSign||!1,undoSignExpiresAt:i.undoSignExpiresAt||null}),console.log("Report loaded successfully from database:",t,"isOwner:",i.isOwner),{success:!0,data:{report:i}}}else throw new Error("Failed to load report data")}catch(e){return console.error("Error loading report from database:",e),d.update(s=>({...s,notification:{type:"error",message:`Failed to load report: ${e.message}`,timestamp:Date.now()}})),null}},async saveToStorage(){try{const t=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(n),e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(S);return console.warn("No session token, cannot save to database"),!1}catch(t){return console.error("Failed to save report:",t),false}},async createReportInDatabase(t,e){try{const s=e.hospitalNumber?.trim();if(!s||s.startsWith("TMP-"))return console.log("Skipping database create: missing or invalid hospital number. Use the patient form to enter proper patient info."),!1;const i=e.firstName?.trim(),a=e.lastName?.trim(),o=e.name?.trim();if(!o&&!i&&!a)return console.log("Skipping database create: missing patient name"),!1;const r=this.parseContentToFields(t.content||""),c={patientName:o||`${i||""} ${a||""}`.trim()||"Unknown Patient",hospitalNumber:s,gender:e.gender||null,dateOfBirth:e.dateOfBirth||null,age:e.age||null,ageUnit:e.ageUnit||"years",modality:e.examType||"OTHER",bodyRegion:e.examSubtype||null,studyDate:e.studyDate||new Date().toISOString().split("T")[0],indication:e.indication||"",content:t.content||"",technique:r.technique,comparison:r.comparison,findings:r.findings,impressions:r.impressions,recommendations:r.recommendations,activeTemplateId:t.activeTemplateId??null,activeTemplateName:t.activeTemplateName??null,status:t.status==="finalized"?"SIGNED":"DRAFT"};console.log("Creating new report in database with payload:",c);const p=await fetch("/api/reports",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(c)});if(!p.ok){const h=await p.text();return console.error("Database create failed:",h),!1}const l=await p.json();return l.success&&l.report?.id?(n.update(h=>({...h,databaseReportId:l.report.id})),console.log("New report created in database with ID:",l.report.id),!0):!1}catch(s){return console.error("Error creating report in database:",s),false}},async saveToDatabase(t,e){try{const s=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(u),i=(t.status||"DRAFT").toUpperCase(),a=s.isOwner,o=s.isAssignedSpecialist;if(i==="SIGNED")return console.log("Skipping save: SIGNED reports are read-only"),!0;if(i==="SUBMITTED"){if(!o)return console.log("Skipping save: SUBMITTED report - not assigned specialist"),!0;console.log("Allowing save for SUBMITTED report: is assigned specialist");}if(i==="DRAFT"){if(!a)return console.log("Skipping save: DRAFT report - not owner"),!0;console.log("Allowing save for DRAFT report: is owner");}const r={content:t.content||"",ifMatchVersion:t.lastSaved||t.lastModified};e.indication?.trim()&&(r.indication=e.indication),e.age&&e.age!==""&&(r.age=e.age,r.ageUnit=e.ageUnit||"years"),e.examSubtype?.trim()&&(r.bodyRegion=e.examSubtype),e.examType?.trim()&&(r.modality=e.examType),e.referringPhysician?.trim()&&(r.referringPhysician=e.referringPhysician),r.activeTemplateId=t.activeTemplateId??null,r.activeTemplateName=t.activeTemplateName??null;const c=await fetch(`/api/reports?id=${t.databaseReportId}`,{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)});if(!c.ok){const l=await c.json().catch(()=>({error:"Unknown error"}));return console.error("Database save failed:",l),!1}const p=await c.json();return p.success&&p.report?.updatedAt&&n.update(l=>({...l,lastSaved:p.report.updatedAt,lastModified:p.report.updatedAt})),p.success}catch(s){return console.error("Error saving to database:",s),false}},parseContentToFields(t){const e={technique:"",comparison:"",findings:"",impressions:"",recommendations:""};if(!t)return e;const s=t.replace(/<br\s*\/?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<[^>]+>/g,"").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim(),i=[{key:"technique",pattern:/TECHNIQUE:\s*([\s\S]*?)(?=(?:COMPARISON:|FINDINGS:|IMPRESSION:|RECOMMENDATIONS:|$))/i},{key:"comparison",pattern:/COMPARISON:\s*([\s\S]*?)(?=(?:TECHNIQUE:|FINDINGS:|IMPRESSION:|RECOMMENDATIONS:|$))/i},{key:"findings",pattern:/FINDINGS:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|IMPRESSION:|RECOMMENDATIONS:|$))/i},{key:"impressions",pattern:/IMPRESSION:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|FINDINGS:|RECOMMENDATIONS:|$))/i},{key:"recommendations",pattern:/RECOMMENDATIONS:\s*([\s\S]*?)(?=(?:TECHNIQUE:|COMPARISON:|FINDINGS:|IMPRESSION:|$))/i}];for(const{key:o,pattern:r}of i){const c=s.match(r);c&&c[1]&&(e[o]=c[1].trim());}return !Object.values(e).some(o=>o.trim()!=="")&&s.trim()&&(e.findings=s.trim()),e},async saveDraft(){const t=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(n),e=(0,_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_0__.E)(u),s=(t.status||"DRAFT").toUpperCase();if(s==="SIGNED")return console.log("Skipping saveDraft: SIGNED reports are read-only"),n.update(a=>({...a,isDirty:false})),true;if(s==="SUBMITTED"){if(!e.isAssignedSpecialist)return console.log("Skipping saveDraft: SUBMITTED report - not assigned specialist"),n.update(o=>({...o,isDirty:false})),true;const a=await this.saveToStorage();return a&&n.update(o=>({...o,isDirty:false,lastSaved:new Date().toISOString()})),a}if(s==="DRAFT"&&!e.isOwner)return console.log("Skipping saveDraft: DRAFT report - not owner"),n.update(a=>({...a,isDirty:false})),true;n.update(a=>({...a,status:a.status==="finalized"?"finalized":"DRAFT",isDirty:true}));const i=await this.saveToStorage();return i&&n.update(a=>({...a,isDirty:false,lastSaved:new Date().toISOString()})),i},async finalizeReport(){n.update(e=>({...e,status:"finalized",finalizedAt:new Date().toISOString(),isDirty:true}));const t=await this.saveToStorage();return t&&n.update(e=>({...e,isDirty:false,lastSaved:new Date().toISOString()})),t},reset(){n.set(g);},save(){return this.saveDraft()},updateSection(t,e){const s={comparison:"COMPARISON:",technique:"TECHNIQUE:",findings:"FINDINGS:",impression:"IMPRESSION:"},i=s[t]?`${s[t]}
${e}

`:e;this.appendContent(i);}},v={setListening(t){d.update(e=>({...e,isListening:t}));},toggleMacroPanel(){d.update(t=>({...t,showMacroPanel:!t.showMacroPanel}));},showMacroPanel(){d.update(t=>({...t,showMacroPanel:true}));},hideMacroPanel(){d.update(t=>({...t,showMacroPanel:false}));},showPatientModal(){d.update(t=>({...t,showPatientModal:true}));},hidePatientModal(){d.update(t=>({...t,showPatientModal:false}));},toggleSidebar(){d.update(t=>({...t,sidebarCollapsed:!t.sidebarCollapsed}));},recordCommand(t){d.update(e=>({...e,lastCommand:t}));},showNotification(t,e){d.update(s=>({...s,notification:{type:t,message:e,timestamp:Date.now()}})),setTimeout(()=>{v.hideNotification();},4e3);},hideNotification(){d.update(t=>({...t,notification:null}));},showSuccessNotification(t){this.showNotification("success",t);},showErrorNotification(t){this.showNotification("error",t);},showInfoNotification(t){this.showNotification("info",t);},setCurrentSection(t){d.update(e=>({...e,activeSection:t})),console.log(`Current section updated to: ${t}`);}};


//# sourceMappingURL=reportStore.js-Cn5OriEF.js.map


/***/ }),

/***/ 42299:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(89831);
/* harmony import */ var _exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(42623);
/* harmony import */ var _utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(26765);
/* harmony import */ var _root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(22967);





const o=_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString().includes("$$")||/function \w+\(\) \{\}/.test(_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_0__.z.toString()),r="a:";o&&new URL(r);
//# sourceMappingURL=state.svelte.js-Cm6uwfjG.js.map


/***/ }),

/***/ 88450:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ q)
/* harmony export */ });
/* harmony import */ var _chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(34899);
/* harmony import */ var _chunks_index_server_js_DHhxyrTW_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(50152);
/* harmony import */ var _chunks_exports_js_CSfjgVlQ_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42623);
/* harmony import */ var _chunks_utils_js_be9Tdq2_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(71621);
/* harmony import */ var _chunks_utils2_js_2HFXsNTe_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(26765);
/* harmony import */ var _chunks_root_js_CksVe0PM_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(22967);
/* harmony import */ var _chunks_state_svelte_js_Cm6uwfjG_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(42299);
/* harmony import */ var _chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(40298);
/* harmony import */ var _chunks_reportStore_js_Cn5OriEF_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(22312);
/* harmony import */ var _chunks_DateFilterDropdown_js_Cczn1uce_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(32657);
/* harmony import */ var _chunks_SSEManager_js_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(39777);
/* harmony import */ var _chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(89831);
/* harmony import */ var _chunks_index2_js_B91mjNiV_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(12144);














function q(y,N){y.component(t$1=>{var i;let n$1;const b="worklist-reports";let f=[],S="",g="ALL",v="ALL",r="",d="",D="",L="all";const w$1=[{value:"ALL",label:"All Priorities"},{value:"STAT",label:"STAT"},{value:"URGENT",label:"Urgent"},{value:"ROUTINE",label:"Routine"}],_=[{value:"ALL",label:"All Statuses"},{value:"PENDING",label:"Pending"},{value:"DRAFT",label:"Draft"},{value:"SUBMITTED",label:"Submitted"},{value:"SIGNED",label:"Signed Off"}];let T=[...["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"]];new Date().toISOString().split("T")[0],(0,_chunks_index_server_js_DHhxyrTW_js__WEBPACK_IMPORTED_MODULE_1__.n)(()=>{_chunks_SSEManager_js_DiJ_NMik_js__WEBPACK_IMPORTED_MODULE_10__.t.unregister(b);}),n$1=(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i??={},"$permissions",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__.h).includes("worklist.create"),(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i??={},"$permissions",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__.h).includes("worklist.pickup"),(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i??={},"$permissions",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__.h).includes("worklist.update"),(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a6)(i??={},"$permissions",_chunks_authStore_js_Bl2ko8Kh_js__WEBPACK_IMPORTED_MODULE_7__.h).includes("worklist.delete"),f.filter(s=>{const a=r.toLowerCase().trim();return (!a||`${s.patientFirstName||""} ${s.patientLastName||""}`.toLowerCase().includes(a)||(s.patientHospitalNumber||"").toLowerCase().includes(a))&&true&&v==="ALL"}),t$1.push(`<div class="worklist-page svelte-1ry8hi"><div class="page-header svelte-1ry8hi"><div class="header-actions svelte-1ry8hi"><input type="text" class="search-input svelte-1ry8hi" placeholder="Search patient name or hospital no..."${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_11__.k)("value",r)}/> `),(0,_chunks_DateFilterDropdown_js_Cczn1uce_js__WEBPACK_IMPORTED_MODULE_9__.w)(t$1,{startDate:d,endDate:D,selectedPreset:L}),t$1.push("<!----> "),t$1.select({class:"status-filter",value:g},s=>{s.push("<!--[-->");const a=(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a9)(_);for(let l=0,o=a.length;l<o;l++){let e=a[l];s.option({value:e.value,class:""},p=>{p.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_11__.P)(e.label)}`);},"svelte-1ry8hi");}s.push("<!--]-->");},"svelte-1ry8hi"),t$1.push(" "),t$1.select({class:"priority-filter",value:v},s=>{s.push("<!--[-->");const a=(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a9)(w$1);for(let l=0,o=a.length;l<o;l++){let e=a[l];s.option({value:e.value,class:""},p=>{p.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_11__.P)(e.label)}`);},"svelte-1ry8hi");}s.push("<!--]-->");},"svelte-1ry8hi"),t$1.push(" "),t$1.select({class:"modality-filter",value:S},s=>{s.option({value:"",class:""},l=>{l.push("All Modalities");},"svelte-1ry8hi"),s.push("<!--[-->");const a=(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a9)(T);for(let l=0,o=a.length;l<o;l++){let e=a[l];s.option({value:e,class:""},p=>{p.push(`${(0,_chunks_attributes_js_BJlrMZid_js__WEBPACK_IMPORTED_MODULE_11__.P)(e)}`);},"svelte-1ry8hi");}s.push("<!--]-->");},"svelte-1ry8hi"),t$1.push(" "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),n$1?t$1.push('<!--[0--><button class="btn-primary svelte-1ry8hi">+ Add Patient</button>'):t$1.push("<!--[-1-->"),t$1.push("<!--]--></div></div> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push('<!--[0--><div class="loading svelte-1ry8hi">Loading worklist...</div>'),t$1.push("<!--]--></div> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push("<!--[-1-->"),t$1.push("<!--]--> "),t$1.push("<!--[-1-->"),t$1.push("<!--]-->"),i&&(0,_chunks_index_js_BPHC9uE5_js__WEBPACK_IMPORTED_MODULE_0__.a7)(i);});}


//# sourceMappingURL=_page.svelte.js-cJDo42Bn.js.map


/***/ })

};

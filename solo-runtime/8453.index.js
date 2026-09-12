export const id = 8453;
export const ids = [8453];
export const modules = {

/***/ 81561:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   p: () => (/* binding */ p)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


/* empty css                                           */function p(t,e){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();let a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.show,false),n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.title,"Confirm Action"),o=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.message,"Are you sure you want to proceed?"),c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.confirmText,"Confirm"),d=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.cancelText,"Cancel"),l=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(e.danger,false);a?(t.out.push("<!--[-->"),t.out.push(`<div class="confirm-backdrop svelte-1dsi18p" role="dialog" aria-modal="true"><div class="confirm-dialog svelte-1dsi18p"><div class="confirm-header svelte-1dsi18p"><h3 class="svelte-1dsi18p">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(n)}</h3></div> <div class="confirm-body svelte-1dsi18p"><p class="svelte-1dsi18p">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o)}</p></div> <div class="confirm-actions svelte-1dsi18p"><button class="btn btn-cancel svelte-1dsi18p">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(d)}</button> <button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("btn svelte-1dsi18p",void 0,{"btn-danger":l,"btn-primary":!l})}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(c)}</button></div></div></div>`)):t.out.push("<!--[!-->"),t.out.push("<!--]-->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(e,{show:a,title:n,message:o,confirmText:c,cancelText:d,danger:l}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=ConfirmDialog-CDS_zF2t.js.map


/***/ }),

/***/ 88453:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ je)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);
/* harmony import */ var _letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(60661);
/* harmony import */ var _ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(81561);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(88609);
/* harmony import */ var _licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(55056);
/* harmony import */ var _tauri_apps_api_core__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(28980);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(72912);










function we(r$1,P){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var s;let o=P.letterhead;const h=`MEDICAL IMAGING REPORT

Patient: John Doe
Date: ${new Date().toLocaleDateString()}
Study: Chest X-ray

FINDINGS:
The cardiac silhouette is normal in size and configuration. The mediastinal contours are within normal limits. The lung fields are clear bilaterally with no evidence of infiltrate, effusion, or pneumothorax.

IMPRESSION:
Normal chest radiograph.

Dr. Sarah Johnson, MD
Radiologist`;r$1.out.push('<div class="letterhead-preview svelte-r52uef"><h4 class="svelte-r52uef">📄 PDF Preview</h4> <p class="preview-description svelte-r52uef">Preview how your letterhead will appear on medical reports</p> <div class="preview-layout svelte-r52uef"><div class="preview-container svelte-r52uef">'),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.position==="top"?(r$1.out.push("<!--[-->"),r$1.out.push(`<div class="letterhead-section svelte-r52uef"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(`height: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.height)}px; margin-top: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.topMargin)}px;`)}><img${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("src",o.url)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("alt",o.name)} class="letterhead-image svelte-r52uef"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(` opacity: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.opacity)}; max-height: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.height)}px; margin-left: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.margin)}px; margin-right: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.margin)}px; `)}/></div>`)):r$1.out.push("<!--[!-->"),r$1.out.push(`<!--]--> <div class="report-content svelte-r52uef"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(`margin: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.margin)}px;`)}><pre class="report-text svelte-r52uef">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(h)}</pre></div> `),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.position==="bottom"?(r$1.out.push("<!--[-->"),r$1.out.push(`<div class="letterhead-footer svelte-r52uef"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(`height: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.height)}px;`)}><img${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("src",o.url)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("alt",o.name)} class="letterhead-image svelte-r52uef"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.K)(` opacity: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.opacity)}; max-height: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.height)}px; margin: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.margin)}px; `)}/></div>`)):r$1.out.push("<!--[!-->"),r$1.out.push(`<!--]--></div> <div class="settings-panel svelte-r52uef"><h5 class="svelte-r52uef">⚙️ Letterhead Settings</h5> <div class="setting-group svelte-r52uef"><label for="height-slider" class="svelte-r52uef">Height: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.height)}px</label> <input id="height-slider" type="range" min="60" max="200"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.height)} class="slider svelte-r52uef"/></div> <div class="setting-group svelte-r52uef"><label for="opacity-slider" class="svelte-r52uef">Opacity: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(Math.round((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.opacity*100))}%</label> <input id="opacity-slider" type="range" min="0.3" max="1" step="0.1"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.opacity)} class="slider svelte-r52uef"/></div> <div class="setting-group svelte-r52uef"><label for="margin-slider" class="svelte-r52uef">Side Margin: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.margin)}px</label> <input id="margin-slider" type="range" min="10" max="50"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.margin)} class="slider svelte-r52uef"/></div> <div class="setting-group svelte-r52uef"><label for="top-margin-slider" class="svelte-r52uef">Top Margin: ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.topMargin)}px</label> <input id="top-margin-slider" type="range" min="0" max="60"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.topMargin)} class="slider svelte-r52uef"/></div> <div class="setting-group svelte-r52uef"><label for="position-select" class="svelte-r52uef">Position:</label> <select id="position-select" class="position-select svelte-r52uef">`),r$1.select_value=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).settings.position,r$1.out.push(`<option value="top"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(r$1,"top")}>Top of page</option><option value="bottom"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(r$1,"bottom")}>Bottom of page</option>`),r$1.select_value=void 0,r$1.out.push("</select></div></div></div></div>"),s&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(s),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(P,{letterhead:o}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function Se(r$1,P){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var s;let o=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(P.isAdmin,true),h=false,A=true,_;function g(i){if(i.out.push('<div class="letterhead-manager svelte-vlxlaj"><div class="manager-header svelte-vlxlaj"><h3 class="svelte-vlxlaj">🏥 Letterhead Management</h3> <p class="svelte-vlxlaj">'),o?(i.out.push("<!--[-->"),i.out.push("Upload and manage your hospital letterheads for professional reports")):(i.out.push("<!--[!-->"),i.out.push("View the organization letterhead used on professional reports")),i.out.push("<!--]--></p> "),o?i.out.push("<!--[!-->"):(i.out.push("<!--[-->"),i.out.push('<p class="admin-note svelte-vlxlaj">Letterhead is set by the administrator and applies to all users.</p>')),i.out.push("<!--]--></div> "),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead?(i.out.push("<!--[-->"),i.out.push(`<div class="current-selection svelte-vlxlaj"><h4 class="svelte-vlxlaj">📄 Current Letterhead</h4> <div class="current-letterhead svelte-vlxlaj"><img${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("src",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead.url)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("alt",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead.name)} class="current-image svelte-vlxlaj"/> <div class="current-info svelte-vlxlaj"><span class="current-name svelte-vlxlaj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead.name)}</span> `),o?(i.out.push("<!--[-->"),i.out.push('<button class="clear-btn svelte-vlxlaj">Remove</button>')):i.out.push("<!--[!-->"),i.out.push("<!--]--></div></div></div>")):(i.out.push("<!--[!-->"),i.out.push('<div class="no-selection svelte-vlxlaj">'),o?(i.out.push("<!--[-->"),i.out.push("<p>No letterhead selected. Choose one below or upload a new one.</p>")):(i.out.push("<!--[!-->"),i.out.push("<p>No letterhead has been set by the administrator yet.</p>")),i.out.push("<!--]--></div>")),i.out.push("<!--]--> "),o?(i.out.push("<!--[-->"),i.out.push('<div class="upload-section svelte-vlxlaj">'),i.out.push("<!--[!-->"),i.out.push('<button class="upload-btn svelte-vlxlaj">📁 Upload New Letterhead</button>'),i.out.push("<!--]--></div>")):i.out.push("<!--[!-->"),i.out.push("<!--]--> "),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).letterheads.length>0&&o){i.out.push("<!--[-->");const D=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).letterheads);i.out.push('<div class="letterheads-grid svelte-vlxlaj"><h4 class="svelte-vlxlaj">Available Letterheads</h4> <div class="grid svelte-vlxlaj"><!--[-->');for(let T=0,S=D.length;T<S;T++){let b=D[T];i.out.push(`<div${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("letterhead-card svelte-vlxlaj",void 0,{selected:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead?.id===b.id})}><img${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("src",b.url)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("alt",b.name)} class="letterhead-thumb svelte-vlxlaj"/> <div class="card-info svelte-vlxlaj"><span class="letterhead-name svelte-vlxlaj">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(b.name)}</span> <div class="card-actions svelte-vlxlaj"><button class="use-btn svelte-vlxlaj"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead?.id===b.id,true)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead?.id===b.id?"Current":"Use")}</button> <button class="delete-btn svelte-vlxlaj">🗑️</button></div></div></div>`);}i.out.push("<!--]--></div></div>");}else i.out.push("<!--[!-->");i.out.push("<!--]--> "),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead?(i.out.push("<!--[-->"),i.out.push('<div class="preview-section svelte-vlxlaj">'),we(i,{letterhead:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s??={},"$letterheadStore",_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.r).currentLetterhead}),i.out.push("<!----></div>")):i.out.push("<!--[!-->"),i.out.push("<!--]--></div> "),(0,_ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_4__.p)(i,{title:"Delete Letterhead?",message:"Are you sure you want to delete this letterhead?",confirmText:"Delete",cancelText:"Cancel",danger:true,get show(){return h},set show(D){h=D,A=false;}}),i.out.push("<!---->");}do A=true,_=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.r)(r$1),g(_);while(!A);(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.L)(r$1,_),s&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(s),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(P,{isAdmin:o}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function ke(r,P){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)(),r.out.push('<div class="signature-manager svelte-1krbk4t"><div class="section-header svelte-1krbk4t"><h3 class="svelte-1krbk4t">Digital Signature</h3> <p class="section-description svelte-1krbk4t">Upload your handwritten signature. The background will be automatically removed for professional PDF reports.</p></div> '),r.out.push("<!--[!-->"),r.out.push('<div class="no-signature svelte-1krbk4t"><div class="upload-prompt svelte-1krbk4t"><div class="upload-icon svelte-1krbk4t">✍️</div> <p class="svelte-1krbk4t">No signature uploaded yet</p> <button class="btn btn-primary svelte-1krbk4t">Upload Signature</button></div></div>'),r.out.push("<!--]--> "),r.out.push("<!--[!-->"),r.out.push('<!--]--> <input type="file" accept="image/*" style="display: none;"/></div>'),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function je(r,P){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var s$1;let o$1,h$1,A$1,_,g=typeof window<"u"&&localStorage.getItem("settings_active_tab")||"general",i=D();function D(){return {general:{theme:"light",autoSave:true,autoSaveInterval:30,showConfirmation:true},voice:{enabled:true,language:"en-US",continuous:true,confidenceThreshold:.7,autoCorrection:true,medicalTerms:true,contributeTrainingData:false},ai:{ollamaUrl:"http://localhost:11434",model:"mistral:7b",enabled:true},reports:{defaultTemplate:"blank",includeTechnique:true,includeComparison:true,pdfFormat:"standard",exportQuality:"high"},interface:{fontSize:"medium",tooltips:true,animations:true},clinical:{institutionName:"",designation:"Radiologist",userName:"",credentials:"MD",signature:"",worklistIntegration:false,pacsIntegration:false}}}let T="",S=false,b={fullName:"",email:"",specialty:"",department:""},F={currentPassword:"",newPassword:"",confirmPassword:""},I=false,W={question:"",answer:""},K=false;const se=["What was the name of your first patient?","In which city did you complete your medical degree?","What is your medical school mentor's last name?","What was your first hospital rotation specialty?","What is your favorite medical textbook?","What was the name of your first clinical supervisor?","In which year did you complete your medical internship?","What is your mother's maiden name?"];let Y=false,B=false,le="",ie="",ae="",L=false,ne=false;function re(){i.ai&&_letterheadStore_DU0aUWUq_js__WEBPACK_IMPORTED_MODULE_3__.R.setConfig(i.ai.ollamaUrl,i.ai.model);}let U="",oe="",v=null,N=false,ue=false,X=null,V=null;async function ve$1(){N=true,v=await _licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.A.getSubscriptionStatus(),N=false;}const ce=[{id:"profile",label:"Admin Profile",icon:"👨‍⚕️"},{id:"general",label:"General",icon:"⚙️"},{id:"voice",label:"Voice Recognition",icon:"🎤"},{id:"ai",label:"AI Assistant",icon:"✨"},{id:"letterheads",label:"Letterheads",icon:"🏥"},{id:"clinical",label:"External Integrations",icon:"🔗"},{id:"license",label:"License",icon:"🔑"},...[{id:"backup",label:"Backup & Restore",icon:"💾"}]],pe=[{id:"profile",label:"Doctor Profile",icon:"👨‍⚕️"},{id:"general",label:"General",icon:"⚙️"},{id:"voice",label:"Voice Settings",icon:"🎤"},{id:"license",label:"License",icon:"🔑"}],de=[{id:"profile",label:"Profile",icon:"👤"},{id:"general",label:"General",icon:"⚙️"},{id:"license",label:"License",icon:"🔑"}];o$1=!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("reports.create")&&!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("templates.read"),h$1=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("users.manage"),A$1=o$1?de:h$1?ce:pe,A$1.map(M=>M.id).includes(g)||(g="profile"),typeof window<"u"&&g&&localStorage.setItem("settings_active_tab",g),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p)&&(b={fullName:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p).fullName||"",email:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p).email||"",specialty:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p).specialty||"Radiology",department:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p).department||"",institution:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p).institution||""}),_=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p)?.roleDisplayName||"Not assigned",i.ai&&re(),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$isLicenseActive",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.o)&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).license?.key&&ve$1();let j=true,G;function me(e){const M=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(A$1);(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.J)(e,x=>{x.title="<title>Settings - KrisPoint</title>";}),e.out.push('<div class="settings-page svelte-37evxm"><div class="settings-container svelte-37evxm"><div class="settings-sidebar svelte-37evxm"><nav class="settings-nav svelte-37evxm"><!--[-->');for(let x=0,c=M.length;x<c;x++){let u=M[x];e.out.push(`<button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("nav-item svelte-37evxm",void 0,{active:g===u.id})}><span class="nav-icon svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(u.icon)}</span> <span class="nav-label svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(u.label)}</span></button>`);}if(e.out.push('<!--]--></nav></div> <div class="settings-content svelte-37evxm">'),g==="profile"){e.out.push("<!--[-->");const x=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(se);e.out.push(`<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(o$1?"👤 Profile":h$1?"👨‍⚕️ Admin Profile":"👨‍⚕️ Doctor Profile")}</h2> <div class="profile-info svelte-37evxm"><div class="setting-group svelte-37evxm"><label for="profile-username" class="svelte-37evxm">Username</label> <input id="profile-username" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p)?.username||"Not available")} disabled class="readonly-field svelte-37evxm"/> <p class="setting-description svelte-37evxm">Your username cannot be changed</p></div> <div class="setting-group svelte-37evxm"><label for="profile-fullname" class="svelte-37evxm">Full Name</label> <input id="profile-fullname" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",b.fullName)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("placeholder",o$1?"Your full name":"Dr. Full Name")}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",S,true)} class="svelte-37evxm"/></div> <div class="setting-group svelte-37evxm"><label for="profile-email" class="svelte-37evxm">Email</label> <input id="profile-email" type="email"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",b.email)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("placeholder",o$1?"email@hospital.com":"doctor@hospital.com")}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",S,true)} class="svelte-37evxm"/></div> `),o$1?e.out.push("<!--[!-->"):(e.out.push("<!--[-->"),e.out.push('<div class="setting-row svelte-37evxm"><div class="setting-group svelte-37evxm"><label for="profile-specialty" class="svelte-37evxm">Specialty</label> '),h$1?(e.out.push("<!--[-->"),e.out.push(`<select id="profile-specialty"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",S,true)} class="svelte-37evxm">`),e.select_value=b.specialty,e.out.push(`<option value="Radiology"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"Radiology")} class="svelte-37evxm">Radiology</option><option value="Diagnostic Radiology"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"Diagnostic Radiology")} class="svelte-37evxm">Diagnostic Radiology</option><option value="Interventional Radiology"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"Interventional Radiology")} class="svelte-37evxm">Interventional Radiology</option><option value="Nuclear Medicine"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"Nuclear Medicine")} class="svelte-37evxm">Nuclear Medicine</option><option value="Radiation Oncology"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"Radiation Oncology")} class="svelte-37evxm">Radiation Oncology</option>`),e.select_value=void 0,e.out.push("</select>")):(e.out.push("<!--[!-->"),e.out.push(`<input id="profile-specialty" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",b.specialty||"Not assigned")} disabled class="readonly-field svelte-37evxm"/> <p class="setting-description svelte-37evxm">Specialty is set by the administrator</p>`)),e.out.push(`<!--]--></div> <div class="setting-group svelte-37evxm"><label for="profile-designation" class="svelte-37evxm">Designation</label> <input id="profile-designation" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",_)} disabled class="readonly-field svelte-37evxm"/> <p class="setting-description svelte-37evxm">Designation is determined by your assigned role</p></div></div> <div class="setting-group svelte-37evxm"><label for="profile-department" class="svelte-37evxm">Department</label> `),h$1?(e.out.push("<!--[-->"),e.out.push(`<input id="profile-department" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",b.department)} placeholder="e.g., Radiology Department"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",S,true)} class="svelte-37evxm"/>`)):(e.out.push("<!--[!-->"),e.out.push(`<input id="profile-department" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",b.department||"Not assigned")} disabled class="readonly-field svelte-37evxm"/> <p class="setting-description svelte-37evxm">Department is set by the administrator</p>`)),e.out.push("<!--]--></div>")),e.out.push('<!--]--> <div class="setting-group svelte-37evxm"><label for="profile-institution" class="svelte-37evxm">Facility/Institution</label> '),h$1?(e.out.push("<!--[-->"),e.out.push(`<input id="profile-institution" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",T)} placeholder="Hospital or medical institution name"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",S,true)} class="svelte-37evxm"/> <p class="setting-description svelte-37evxm">This institution name is shared across all users in the system</p>`)):(e.out.push("<!--[!-->"),e.out.push(`<input id="profile-institution" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value","Not set by administrator")} disabled class="readonly-field svelte-37evxm"/> <p class="setting-description svelte-37evxm">Institution is set by the system administrator</p>`)),e.out.push("<!--]--></div></div> "),o$1?e.out.push("<!--[!-->"):(e.out.push("<!--[-->"),e.out.push('<div class="signature-section svelte-37evxm"><h3 class="svelte-37evxm">🖋️ Digital Signature</h3> <p class="setting-description svelte-37evxm">Upload your signature image. White backgrounds are automatically removed for professional PDF reports.</p> '),ke(e),e.out.push("<!----></div>")),e.out.push(`<!--]--> <div class="password-section svelte-37evxm"><h3 class="svelte-37evxm">🔒 Change Password</h3> <p class="setting-description svelte-37evxm">Update your password to keep your account secure. Requirements: at least 8 characters, including uppercase, lowercase, number, and special character.</p> <div class="password-form svelte-37evxm"><div class="setting-group svelte-37evxm"><label for="current-password" class="svelte-37evxm">Current Password</label> <input id="current-password" type="password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",F.currentPassword)} placeholder="Enter current password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",I,true)} class="svelte-37evxm"/></div> <div class="setting-group svelte-37evxm"><label for="new-password" class="svelte-37evxm">New Password</label> <input id="new-password" type="password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",F.newPassword)} placeholder="Min 8 chars, uppercase, lowercase, number, symbol"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",I,true)} class="svelte-37evxm"/></div> <div class="setting-group svelte-37evxm"><label for="confirm-password" class="svelte-37evxm">Confirm New Password</label> <input id="confirm-password" type="password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",F.confirmPassword)} placeholder="Re-enter new password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",I,true)} class="svelte-37evxm"/></div> <button type="button" class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",I,true)}>`),e.out.push("<!--[!-->"),e.out.push("🔑 Change Password"),e.out.push("<!--]--></button> "),e.out.push("<!--[!-->"),e.out.push('<!--]--></div></div> <div class="security-question-section svelte-37evxm"><h3 class="svelte-37evxm">🔐 Password Recovery Setup</h3> <p class="setting-description svelte-37evxm">'),e.out.push("<!--[!-->"),e.out.push("Set up a security question to recover your password if you forget it. This works completely offline - no email required!"),e.out.push(`<!--]--></p> <div class="security-question-form svelte-37evxm"><div class="setting-group svelte-37evxm"><label for="security-question" class="svelte-37evxm">Security Question</label> <select id="security-question"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",K,true)} class="svelte-37evxm">`),e.select_value=W.question,e.out.push(`<option value=""${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"")} class="svelte-37evxm">-- Select a question --</option><!--[-->`);for(let c=0,u=x.length;c<u;c++){let f=x[c];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",f)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,f)} class="svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(f)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push(`</select></div> <div class="setting-group svelte-37evxm"><label for="security-answer" class="svelte-37evxm">Your Answer</label> <input id="security-answer" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",W.answer)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("placeholder","Enter your answer (case-insensitive)")}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",K,true)} class="svelte-37evxm"/> <p class="setting-description-small svelte-37evxm">💡 Answers are case-insensitive. "John Smith" and "john smith" will both work.</p></div> <button type="button" class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",K,true)}>`),e.out.push("<!--[!-->"),e.out.push(`${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("✅ Set Up Security Question")}`),e.out.push(`<!--]--></button></div></div> <div class="profile-actions svelte-37evxm"><button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",S,true)}>`),e.out.push("<!--[!-->"),e.out.push("💾 Save Profile"),e.out.push('<!--]--></button> <button class="btn btn-outline btn-logout svelte-37evxm">🚪 Logout</button></div></div>');}else e.out.push("<!--[!-->");if(e.out.push("<!--]--> "),g==="general"?(e.out.push("<!--[-->"),e.out.push('<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">General Settings</h2> <div class="setting-group svelte-37evxm"><label for="theme-select" class="svelte-37evxm">Theme</label> <select id="theme-select" class="svelte-37evxm">'),e.select_value=i.general.theme,e.out.push(`<option value="light"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"light")} class="svelte-37evxm">Light Theme</option><option value="dark"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,"dark")} class="svelte-37evxm">Dark Theme</option>`),e.select_value=void 0,e.out.push(`</select></div> <div class="setting-group checkbox-group svelte-37evxm"><label class="svelte-37evxm"><input type="checkbox"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",i.general.showConfirmation,true)} class="svelte-37evxm"/> Show confirmation dialogs</label></div> <div class="setting-group checkbox-group svelte-37evxm"><label class="svelte-37evxm"><input type="checkbox"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",i.interface.tooltips,true)} class="svelte-37evxm"/> Show tooltips</label></div> <div class="setting-group checkbox-group svelte-37evxm"><label class="svelte-37evxm"><input type="checkbox"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",i.interface.animations,true)} class="svelte-37evxm"/> Enable animations</label></div></div>`)):e.out.push("<!--[!-->"),e.out.push("<!--]--> "),g==="backup"?(e.out.push("<!--[-->"),e.out.push(`<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">Backup &amp; Restore</h2> <div class="backup-warning svelte-37evxm"><strong class="svelte-37evxm">Keep your backup password safe.</strong> If you lose both this workstation and the backup password, encrypted patient data cannot be recovered.
              The backup includes the database and the protected recovery keys required on a replacement computer.</div> <div class="backup-panel svelte-37evxm"><h3 class="svelte-37evxm">Create encrypted backup</h3> <div class="setting-group svelte-37evxm"><label for="backup-password" class="svelte-37evxm">Backup password</label> <input id="backup-password" type="password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",le)} minlength="12"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",L,true)} autocomplete="new-password" class="svelte-37evxm"/> <p class="setting-description svelte-37evxm">Use at least 12 characters. This password is not stored by KrisPoint.</p></div> <div class="setting-group svelte-37evxm"><label for="backup-password-confirm" class="svelte-37evxm">Confirm backup password</label> <input id="backup-password-confirm" type="password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",ie)} minlength="12"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",L,true)} autocomplete="new-password" class="svelte-37evxm"/></div> <div class="setting-group svelte-37evxm"><label for="backup-account-password" class="svelte-37evxm">KrisPoint account password</label> <input id="backup-account-password" type="password"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",ae)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",L,true)} autocomplete="current-password" class="svelte-37evxm"/> <p class="setting-description svelte-37evxm">Required to authorize backup and restore operations.</p></div> <button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",L,true)}>Create encrypted backup</button></div> <div class="backup-panel svelte-37evxm"><h3 class="svelte-37evxm">Restore from backup</h3> <p class="setting-description svelte-37evxm">The backup is decrypted and fully validated before current data is replaced. If replacement fails, current data is restored automatically.</p> <button class="btn btn-danger svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",L,true)}>Choose backup and restore</button></div></div>`)):e.out.push("<!--[!-->"),e.out.push("<!--]--> "),g==="voice"?(e.out.push("<!--[-->"),e.out.push(`<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(h$1?"Voice Recognition Settings":"Voice Training Consent")}</h2> `),h$1?(e.out.push("<!--[-->"),e.out.push(`<div class="setting-group checkbox-group svelte-37evxm"><label class="svelte-37evxm"><input type="checkbox"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",i.voice.enabled,true)} class="svelte-37evxm"/> Enable voice recognition</label></div> `),e.out.push("<!--[-->"),e.out.push(`<div class="setting-group svelte-37evxm"><label for="voice-confidence" class="svelte-37evxm">Confidence Threshold</label> <input id="voice-confidence" type="range" min="0.1" max="1" step="0.1"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i.voice.confidenceThreshold)} class="svelte-37evxm"/> <span class="range-value svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i.voice.confidenceThreshold)}</span></div> <div class="section-info svelte-37evxm"><p class="svelte-37evxm"><strong class="svelte-37evxm">Smart Punctuation:</strong> Periods, commas, and question marks are automatically inserted by AI as you speak. Manual voice commands are available for special punctuation (semicolons, colons, quotes, brackets, etc.).</p></div>`),e.out.push("<!--]-->")):e.out.push("<!--[!-->"),e.out.push(`<!--]--> <div class="training-data-section svelte-37evxm"><h3 class="svelte-37evxm">Training Data Collection</h3> <div class="setting-group checkbox-group svelte-37evxm"><label class="checkbox-label svelte-37evxm"><input type="checkbox"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",i.voice.contributeTrainingData,true)} class="svelte-37evxm"/> Contribute to voice recognition training</label></div> <div class="section-info training-info svelte-37evxm"><p class="svelte-37evxm">Help improve voice recognition for medical terminology by contributing your dictation data. When enabled:</p> <ul class="svelte-37evxm"><li class="svelte-37evxm">Audio recordings and transcripts are collected during dictation</li> <li class="svelte-37evxm">Administrators review and verify transcripts for training</li> <li class="svelte-37evxm">Data is only accessible to administrators</li> <li class="svelte-37evxm">You can opt out at any time</li></ul></div></div></div>`)):e.out.push("<!--[!-->"),e.out.push("<!--]--> "),g==="ai"?(e.out.push("<!--[-->"),e.out.push(`<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">✨ AI Assistant Settings</h2> <p class="section-info svelte-37evxm">Configure Ollama for AI-powered report generation and polishing. Ollama runs locally on your machine for complete privacy.</p> <div class="setting-group svelte-37evxm"><label for="ollama-url" class="svelte-37evxm">Ollama Server URL</label> <input id="ollama-url" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i.ai.ollamaUrl)} placeholder="http://localhost:11434" class="svelte-37evxm"/> <p class="setting-description svelte-37evxm">The URL where Ollama is running. Default is http://localhost:11434</p></div> <div class="setting-group svelte-37evxm"><label for="ai-model" class="svelte-37evxm">AI Model</label> <input id="ai-model" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",i.ai.model)} placeholder="mistral:7b" class="svelte-37evxm"/> <p class="setting-description svelte-37evxm">The Ollama model to use. Popular options: mistral:7b, llama3.1:8b, gemma2:9b <br class="svelte-37evxm"/>Make sure you've downloaded the model first: <code class="svelte-37evxm">ollama pull ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i.ai.model)}</code></p></div> <div class="setting-group svelte-37evxm"><button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",ne,true)}>`),e.out.push("<!--[!-->"),e.out.push("🔗 Test Connection"),e.out.push("<!--]--></button> "),e.out.push("<!--[!-->"),e.out.push("<!--[!-->"),e.out.push("<!--]-->"),e.out.push(`<!--]--></div> <div class="ai-info svelte-37evxm"><h3 class="svelte-37evxm">📖 Quick Start Guide</h3> <ol class="svelte-37evxm"><li class="svelte-37evxm">Install Ollama from <a href="https://ollama.com" target="_blank" rel="noopener" class="svelte-37evxm">ollama.com</a></li> <li class="svelte-37evxm">Open terminal and run: <code class="svelte-37evxm">ollama pull ${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(i.ai.model)}</code></li> <li class="svelte-37evxm">Start Ollama: <code class="svelte-37evxm">ollama serve</code></li> <li class="svelte-37evxm">Click "Test Connection" above to verify</li> <li class="svelte-37evxm">Use the ✨ button in the report editor to generate or polish reports!</li></ol> <p class="svelte-37evxm"><strong class="svelte-37evxm">Privacy Note:</strong> All AI processing happens locally on your computer. No data is sent to external servers.</p></div></div>`)):e.out.push("<!--[!-->"),e.out.push("<!--]--> "),g==="clinical"?(e.out.push("<!--[-->"),e.out.push(`<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">External Integrations</h2> <p class="section-info svelte-37evxm">These integrations are planned for future releases and will enable seamless connection with hospital systems.</p> <div class="setting-group checkbox-group svelte-37evxm"><label class="disabled-option svelte-37evxm"><input type="checkbox" disabled${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",false,true)} class="svelte-37evxm"/> Enable worklist integration (RIS/HIS) <span class="coming-soon svelte-37evxm">— Coming Soon</span></label> <p class="setting-description svelte-37evxm">Connect with Radiology Information System or Hospital Information System for patient worklist management.</p></div> <div class="setting-group checkbox-group svelte-37evxm"><label class="disabled-option svelte-37evxm"><input type="checkbox" disabled${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("checked",false,true)} class="svelte-37evxm"/> Enable PACS integration <span class="coming-soon svelte-37evxm">— Coming Soon</span></label> <p class="setting-description svelte-37evxm">Connect with Picture Archiving and Communication System for medical image viewing and retrieval.</p></div></div>`)):e.out.push("<!--[!-->"),e.out.push("<!--]--> "),g==="letterheads"?(e.out.push("<!--[-->"),e.out.push('<div class="settings-section letterhead-section svelte-37evxm">'),Se(e,{isAdmin:h$1}),e.out.push("<!----></div>")):e.out.push("<!--[!-->"),e.out.push("<!--]--> "),g==="license"){if(e.out.push("<!--[-->"),e.out.push('<div class="settings-section svelte-37evxm"><h2 class="svelte-37evxm">🔑 License Management</h2> '),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$isLicenseActive",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.o)){e.out.push("<!--[-->");const x=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseFeatures",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.w));e.out.push(`<div class="license-status license-active svelte-37evxm"><div class="license-badge svelte-37evxm"><span class="badge-icon svelte-37evxm">✓</span> <span class="badge-text svelte-37evxm">Premium Active</span></div> <div class="license-details svelte-37evxm"><div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">License Key:</span> <span class="detail-value license-key-display svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).license?.key||"N/A")}</span></div> <div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Plan:</span> <span class="detail-value svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).license?.plan||"Premium")}</span></div> <div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Expires:</span> <span class="detail-value svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).expiresAt?new Date((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).expiresAt).toLocaleDateString():"N/A")}</span></div> <div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Days Remaining:</span> <span class="detail-value svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.A.getDaysRemaining()||0)} days</span></div> <div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Features:</span> <span class="detail-value features-list svelte-37evxm"><!--[-->`);for(let c=0,u=x.length;c<u;c++){let f=x[c];e.out.push(`<span class="feature-tag svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(f)}</span>`);}if(e.out.push("<!--]--></span></div></div> "),N)e.out.push("<!--[-->"),e.out.push('<div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Auto-Renewal:</span> <span class="detail-value svelte-37evxm">Checking...</span></div>');else {if(e.out.push("<!--[!-->"),v?.hasSubscription){if(e.out.push("<!--[-->"),e.out.push(`<div class="auto-renewal-section svelte-37evxm"><div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Auto-Renewal:</span> <span${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("detail-value svelte-37evxm",void 0,{"auto-renew-on":v.autoRenew,"auto-renew-off":!v.autoRenew})}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v.autoRenew?"On":"Off")}</span></div> <div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Current Plan:</span> <span class="detail-value svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v.planName||"N/A")} (${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v.planInterval||"N/A")})</span></div> `),v.nextPaymentDate&&v.autoRenew?(e.out.push("<!--[-->"),e.out.push(`<div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Next Payment:</span> <span class="detail-value svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(new Date(v.nextPaymentDate).toLocaleDateString())}</span></div>`)):e.out.push("<!--[!-->"),e.out.push(`<!--]--> <button${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("btn btn-auto-renew svelte-37evxm",void 0,{"btn-danger":v.autoRenew})}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",ue,true)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v.autoRenew?"Turn Off Auto-Renewal":"Turn On Auto-Renewal")}</button> `),v.availablePlans?.length>1){e.out.push("<!--[-->");const c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(v.availablePlans.filter(u=>u.id!==v.planId));e.out.push('<div class="change-plan-section svelte-37evxm" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #e2e8f0);"><label for="change-plan-select" style="font-weight: 500; margin-bottom: 0.5rem; display: block;" class="svelte-37evxm">Change Auto-Renewal Plan</label> <div style="display: flex; gap: 0.5rem; align-items: center;" class="svelte-37evxm"><select id="change-plan-select" style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);" class="svelte-37evxm">'),e.select_value=X,e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",null)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,null)} class="svelte-37evxm">Select a different plan...</option><!--[-->`);for(let u=0,f=c.length;u<f;u++){let p=c[u];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",p.id)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,p.id)} class="svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p.name)} - GH₵${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((p.price_cedis/100).toFixed(2))}/${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p.interval)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push(`</select> <button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!X,true)} style="white-space: nowrap;">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("Change Plan")}</button></div></div>`);}else e.out.push("<!--[!-->");e.out.push("<!--]--></div>");}else {if(e.out.push("<!--[!-->"),e.out.push('<div class="auto-renewal-section svelte-37evxm"><div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Auto-Renewal:</span> <span class="detail-value auto-renew-off svelte-37evxm">Not set up</span></div> '),v?.availablePlans?.length>0){e.out.push("<!--[-->");const c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(v.availablePlans);e.out.push(`<div class="setup-auto-renew svelte-37evxm" style="margin-top: 0.75rem;"><label for="setup-plan-select" style="font-weight: 500; margin-bottom: 0.5rem; display: block;" class="svelte-37evxm">Set Up Auto-Renewal</label> <p style="font-size: 0.85rem; color: var(--text-secondary, #718096); margin-bottom: 0.5rem;" class="svelte-37evxm">Automatically renew your license when it expires. You'll be charged on the expiration date.</p> <div style="display: flex; gap: 0.5rem; align-items: center;" class="svelte-37evxm"><select id="setup-plan-select" style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);" class="svelte-37evxm">`),e.select_value=X,e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",null)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,null)} class="svelte-37evxm">Select a plan...</option><!--[-->`);for(let u=0,f=c.length;u<f;u++){let p=c[u];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",p.id)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,p.id)} class="svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p.name)} - GH₵${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((p.price_cedis/100).toFixed(2))}/${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p.interval)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push(`</select> <button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!X,true)} style="white-space: nowrap;">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("Set Up Auto-Renewal")}</button></div></div>`);}else e.out.push("<!--[!-->");e.out.push("<!--]--></div>");}e.out.push("<!--]-->");}if(e.out.push("<!--]--> "),!N&&v?.availablePlans?.length>0&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl){e.out.push("<!--[-->");const c=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(v.availablePlans);e.out.push('<div class="top-up-section svelte-37evxm" style="margin-top: 1.5rem; padding: 1rem; border-radius: 8px; background: var(--card-bg-alt, rgba(102,126,234,0.05)); border: 1px solid var(--border-color, #e2e8f0);"><h3 style="font-size: 1rem; margin-bottom: 0.5rem;" class="svelte-37evxm">Top Up License</h3> <p style="font-size: 0.85rem; color: var(--text-secondary, #718096); margin-bottom: 0.75rem;" class="svelte-37evxm">Add time to your license immediately with a one-time payment. The extra time is added to your current expiration date.</p> <div style="display: flex; gap: 0.5rem; align-items: center;" class="svelte-37evxm"><select style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color, #e2e8f0); background: var(--input-bg, #fff); color: var(--text-color, #1a202c);" class="svelte-37evxm">'),e.select_value=V,e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",null)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,null)} class="svelte-37evxm">Select a plan...</option><!--[-->`);for(let u=0,f=c.length;u<f;u++){let p=c[u];e.out.push(`<option${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",p.id)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.Z)(e,p.id)} class="svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p.name)} - GH₵${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((p.price_cedis/100).toFixed(2))}/${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(p.interval)}</option>`);}e.out.push("<!--]-->"),e.select_value=void 0,e.out.push(`</select> <button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!V,true)} style="white-space: nowrap;">Top Up Now</button></div></div>`);}else e.out.push("<!--[!-->");e.out.push('<!--]--> <button class="btn btn-secondary svelte-37evxm" style="margin-top: 1rem;">Deactivate License</button></div>');}else e.out.push("<!--[!-->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$isLicenseExpired",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.f)?(e.out.push("<!--[-->"),e.out.push(`<div class="license-status license-expired svelte-37evxm"><div class="license-badge expired svelte-37evxm"><span class="badge-icon svelte-37evxm">⏰</span> <span class="badge-text svelte-37evxm">License Expired</span></div> <div class="license-details svelte-37evxm"><div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">License Key:</span> <span class="detail-value license-key-display svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).license?.key||"N/A")}</span></div> <div class="detail-row svelte-37evxm"><span class="detail-label svelte-37evxm">Expired On:</span> <span class="detail-value expired-date svelte-37evxm">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).expiresAt?new Date((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).expiresAt).toLocaleDateString():"N/A")}</span></div></div> <p class="license-description svelte-37evxm">Your premium license has expired. Renew it to restore access to voice dictation,
                  AI report polishing, inter-user chat, templates, and macros.</p> <div class="renewal-actions svelte-37evxm">`),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl?(e.out.push("<!--[-->"),e.out.push('<button class="btn btn-renew svelte-37evxm">Renew License</button>')):e.out.push("<!--[!-->"),e.out.push(`<!--]--> <button class="btn btn-secondary svelte-37evxm">Enter Different Key</button></div> <div class="setting-group svelte-37evxm" style="margin-top: 1rem;"><label for="license-key-reactivate" class="svelte-37evxm">Or re-activate with a new key</label> <input id="license-key-reactivate" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",U)} placeholder="KP-XXXX-XXXX-XXXX-XXXX"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl,true)} class="svelte-37evxm"/></div> `),e.out.push("<!--[!-->"),e.out.push(`<!--]--> <button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl||!U.trim(),true)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("Activate New Key")}</button></div>`)):(e.out.push("<!--[!-->"),e.out.push(`<div class="license-status license-inactive svelte-37evxm"><div class="license-badge inactive svelte-37evxm"><span class="badge-icon svelte-37evxm">!</span> <span class="badge-text svelte-37evxm">Free Version</span></div> <p class="license-description svelte-37evxm">Activate a license to unlock premium features including voice dictation, 
                  AI report polishing, inter-user chat, templates, and macros.</p> `),h$1?(e.out.push("<!--[-->"),e.out.push(`<div class="setting-group svelte-37evxm"><label for="license-server-url" class="svelte-37evxm">License Server URL</label> <div class="input-with-button svelte-37evxm"><input id="license-server-url" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",oe)} placeholder="https://your-license-server.com or /license-server" class="svelte-37evxm"/> <button class="btn btn-secondary svelte-37evxm">Save</button></div> <p class="setting-description svelte-37evxm">The URL of your self-hosted license server</p></div>`)):e.out.push("<!--[!-->"),e.out.push(`<!--]--> <div class="setting-group svelte-37evxm"><label for="license-key-input" class="svelte-37evxm">License Key</label> <input id="license-key-input" type="text"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("value",U)} placeholder="KP-XXXX-XXXX-XXXX-XXXX"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl,true)} class="svelte-37evxm"/> `),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl?e.out.push("<!--[!-->"):(e.out.push("<!--[-->"),e.out.push('<p class="setting-description warning svelte-37evxm">Please configure the license server URL first (admin required)</p>')),e.out.push("<!--]--></div> "),e.out.push("<!--[!-->"),e.out.push(`<!--]--> <button class="btn btn-primary svelte-37evxm"${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("disabled",!(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(s$1??={},"$licenseState",_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_6__.s).serverUrl||!U.trim(),true)}>${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("Activate License")}</button></div>`)),e.out.push("<!--]-->");e.out.push("<!--]--></div>");}else e.out.push("<!--[!-->");e.out.push('<!--]--></div></div> <div class="save-controls svelte-37evxm"><button class="btn btn-primary save-button svelte-37evxm"><span class="save-icon svelte-37evxm">💾</span> Save Changes</button> '),e.out.push("<!--[!-->"),e.out.push('<div class="saved-indicator svelte-37evxm">✅ All Changes Saved</div>'),e.out.push("<!--]--> "),e.out.push("<!--[!-->"),e.out.push("<!--]--></div></div> "),(0,_ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_4__.p)(e,{title:"Reset All Settings?",message:"Are you sure you want to reset all settings to defaults? This cannot be undone.",confirmText:"Reset",cancelText:"Cancel",danger:true,get show(){return Y},set show(x){Y=x,j=false;}}),e.out.push("<!----> "),(0,_ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_4__.p)(e,{title:"Logout?",message:"Are you sure you want to logout?",confirmText:"Logout",cancelText:"Cancel",get show(){return B},set show(x){B=x,j=false;}}),e.out.push("<!---->");}do j=true,G=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.r)(r),me(G);while(!j);(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.L)(r,G),s$1&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(s$1),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_page.svelte-CEXTSYHB.js.map


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

/***/ 60661:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   R: () => (/* binding */ R),
/* harmony export */   r: () => (/* binding */ r)
/* harmony export */ });
/* harmony import */ var _tauri_apps_api_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(28980);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(72912);



const f={BASE_URL:"/",DEV:false,MODE:"production",PROD:true,SSR:true,TAURI_CLI_VERBOSITY:"0",TAURI_ENV_ARCH:"x86_64",TAURI_ENV_FAMILY:"unix",TAURI_ENV_PLATFORM:"linux",TAURI_ENV_PLATFORM_VERSION:"24.4.0",TAURI_ENV_TARGET_TRIPLE:"x86_64-unknown-linux-gnu",VITE_KRISPOINT_EDITION:"solo"};class T{constructor(){this.baseUrl=this.getOllamaUrl(),this.model="mistral:7b",this.isAvailable=false,this._isTauriRuntime=null;}getOllamaUrl(){if(typeof window<"u"){const s=window.location.hostname;if(s!=="localhost"&&s!=="127.0.0.1")return console.log(`🤖 Ollama URL set to server IP: http://${s}:11434`),`http://${s}:11434`}return "http://localhost:11434"}isTauriRuntime(){return this._isTauriRuntime!==null?this._isTauriRuntime:typeof window<"u"&&!!(window.__TAURI_INTERNALS__||window.__TAURI__?.core)?(console.log("✅ Tauri desktop app detected (host: "+window.location.hostname+")"),this._isTauriRuntime=true,true):(console.log("🌐 Browser/dev mode detected (host: "+window.location.hostname+")"),this._isTauriRuntime=false,false)}async makeRequest(s,t={}){if(this.isTauriRuntime()){console.log("🖥️ Using Tauri backend HTTP proxy (CORS-free)"),console.log("📤 Request:",{url:s,method:t.method,headers:t.headers});try{console.log("⏳ Waiting for Tauri backend response...");const e=await (0,_tauri_apps_api_core__WEBPACK_IMPORTED_MODULE_0__/* .invoke */ .lA)("http_request",{request:{url:s,method:t.method||"GET",headers:t.headers||{},body:t.body||null}});return console.log("✅ Tauri backend response received:",{status:e.status,bodyLength:e.body?.length||0}),{ok:e.status>=200&&e.status<300,status:e.status,statusText:e.status===200?"OK":"Error",headers:e.headers,text:async()=>e.body,json:async()=>JSON.parse(e.body)}}catch(e){throw console.error("❌ Tauri backend error:",e),new Error(`Tauri HTTP request failed: ${e.message||e}`)}}else return console.log("🌐 Using browser fetch"),fetch(s,t)}async checkAvailability(){return  false}setConfig(s,t){this.baseUrl=s||"http://localhost:11434",this.model=t||"mistral:7b";}getConfig(){return {baseUrl:this.baseUrl,model:this.model}}stripHtml(s){if(!s)return "";let t=s.replace(/<br\s*\/?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/div>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<\/tr>/gi,`
`).replace(/<\/h[1-6]>/gi,`
`);return t=t.replace(/<[^>]*>/g,""),t=t.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&bull;/gi,"•"),t=t.replace(/\n\s*\n\s*\n/g,`

`).trim(),t}async smartRefine(s,t,e,i,r=null){if(!this.isAvailable)throw new Error("Ollama is not running. Please start Ollama and try again.");const n=this.stripHtml(s),l=this.stripHtml(t);return console.log("🧹 Stripped HTML from content:",{originalLength:s.length,cleanLength:n.length,hadHtml:s.includes("<")}),this.analyzeCompleteness(n).isComplete?this.polishReport(n,r):this.generateFullReport(n,l,e,r)}async generateFullReport(s,t,e="General",i=null){if(!this.isAvailable)throw new Error("Ollama is not running.");const r=`You are a professional radiologist report writer. Your task is ONLY to rewrite findings into a structured radiology report.

STRICT RULES:
1. Output EXACTLY this structure with these section headers:
   COMPARISON:
   [single line - reference comparison or state if unavailable]
   
   TECHNIQUE:
   [2-3 sentences describing imaging technique]
   
   FINDINGS:
   [rewritten findings from input, organized by anatomy, professional language, NO speculation]
   
   IMPRESSION:
   [1-3 sentences - concise diagnostic impression based ONLY on findings]

2. MANDATORY REQUIREMENTS:
   - Use professional radiology terminology ONLY
   - NO personal observations, NO speculation, NO "suggestive of"
   - Format findings as paragraphs OR bullet points (•) - choose what's most appropriate for the content
   - If findings are simple/few, use paragraphs; if multiple findings, use bullet points
   - Impression must match findings exactly - no extra diagnoses
   - Keep language precise, concise, medical-grade

3. INPUT DATA:
   Clinical Indication: ${t||"Not provided"}
   Report Type: ${e}
   Raw Findings: ${s}

CRITICAL: Output the report structure EXACTLY as shown above. Do not add any extra text before or after.`;return this.callOllama(r,i)}async polishReport(s,t=null){if(!this.isAvailable)throw new Error("Ollama is not running.");const e=`You are a professional radiologist editor. Your task is ONLY to improve the language and clarity of a radiology report.

STRICT RULES:
1. PRESERVE the existing structure:
   - Keep all sections: COMPARISON, TECHNIQUE, FINDINGS, IMPRESSION
   - Keep all findings and content - do NOT remove or add findings
   - Keep all section headers exactly as they are

2. IMPROVEMENTS ALLOWED ONLY:
   - Fix grammar and spelling
   - Improve medical terminology (more professional)
   - Clarify awkward sentences
   - Standardize formatting (consistent terminology)
   - Remove redundancy within the same section

3. IMPROVEMENTS FORBIDDEN:
   - Do NOT add new findings
   - Do NOT change findings content or meaning
   - Do NOT modify impression (keep exact same clinical meaning)
   - Do NOT reorganize sections
   - Do NOT change section headers

4. REPORT TO EDIT:
${s}

CRITICAL: Output the complete polished report with ALL sections intact. Make NO structural changes.`;return this.callOllama(e,t)}async generateImpression(s,t){if(!this.isAvailable)throw new Error("Ollama is not running.");const e=this.stripHtml(s),i=this.stripHtml(t),r=`You are a radiologist creating an impression for a medical report.

STRICT RULES:
1. Output ONLY the impression text - nothing else
2. Impression MUST be based ONLY on the provided findings
3. Impression must be 1-3 sentences, concise and professional
4. Use definitive language (not speculative like "suggestive of", "cannot exclude")
5. If findings are normal, state normal and list the study type
6. If findings are abnormal, state the findings and their clinical relevance

INPUT:
Clinical Indication: ${e||"Not provided"}
Findings: ${i}

CRITICAL: Respond with ONLY the impression text. No labels, no extra text. Start directly with the impression.`;return this.callOllama(r)}async callOllama(s,t=null){try{let e="";const i={model:this.model,prompt:s,stream:!0,temperature:.3},r=this.isTauriRuntime();console.log("🚀 Ollama request:",{isTauri:r,url:`${this.baseUrl}/api/generate`,model:this.model,fetchType:r?"Tauri backend proxy (no streaming)":"Browser fetch (streaming)",env:f?.TAURI_PLATFORM||"browser"});const n=await this.makeRequest(`${this.baseUrl}/api/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(console.log("📥 Ollama response:",{ok:n.ok,status:n.status,statusText:n.statusText,headers:n.headers}),!n.ok){const l=await n.text();throw console.error("❌ Ollama error response:",l),new Error(`Ollama API error: ${n.status} ${n.statusText}`)}if(r){console.log("🖥️ Tauri mode: Getting full response (no streaming)");const c=(await n.text()).split(`
`).filter(o=>o.trim());for(const o of c)try{const a=JSON.parse(o);a.response&&(e+=a.response);}catch{}t&&e&&(console.log("✅ Full response ready, length:",e.length),t(e));}else {const l=n.body.getReader(),c=new TextDecoder;let o="";for(;;){const{done:a,value:g}=await l.read();if(a)break;const m=c.decode(g,{stream:!0});o+=m;const u=o.split(`
`);o=u.pop()||"";for(const d of u)if(d.trim())try{const p=JSON.parse(d);p.response&&(e+=p.response,console.log("🔄 Streaming token:",p.response),t&&t(e));}catch(p){console.warn("JSON parse error:",p.message,"Line:",d);}}if(o.trim())try{const a=JSON.parse(o);a.response&&(e+=a.response,t&&t(e));}catch{}}return console.log("✅ Ollama generation complete, total length:",e.length),e.trim()}catch(e){throw console.error("❌ Ollama API error:",{message:e.message,stack:e.stack,name:e.name,error:e}),e}}analyzeCompleteness(s){const t=/COMPARISON:/i.test(s),e=/TECHNIQUE:/i.test(s),i=/FINDINGS:/i.test(s),r=/IMPRESSION:/i.test(s),n=s.replace(/\s+/g," ").length,l=n>300;return {isComplete:e&&i&&r&&l,sections:{hasComparison:t,hasTechnique:e,hasFindings:i,hasImpression:r},contentLength:n}}}const R=new T;

const r=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_1__.z)({currentLetterhead:null,letterheads:[],isUploading:false,uploadProgress:0,uploadError:null,isLoading:false,settings:{height:120,opacity:1,position:"top",margin:20,topMargin:10}});


//# sourceMappingURL=letterheadStore-DU0aUWUq.js.map


/***/ }),

/***/ 55056:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (/* binding */ A),
/* harmony export */   f: () => (/* binding */ f),
/* harmony export */   o: () => (/* binding */ o),
/* harmony export */   p: () => (/* binding */ p),
/* harmony export */   s: () => (/* binding */ s),
/* harmony export */   w: () => (/* binding */ w)
/* harmony export */ });
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(72912);


const c={isActivated:false,license:null,features:[],expiresAt:null,lastValidated:null,error:null,isLoading:false,serverUrl:""},s=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.z)(c),o=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(s,e=>!(!e.isActivated||!e.license||e.expiresAt&&new Date(e.expiresAt)<new Date)),f=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(s,e=>e.license?!!(e.expiresAt&&new Date(e.expiresAt)<new Date):false),w=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.E)(s,e=>e.features||[]),p=e=>{const r=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(s);return !r.isActivated||r.expiresAt&&new Date(r.expiresAt)<new Date?false:r.features?.includes(e)||false},A={async initialize(){},setServerUrl(e){},async activate(e){return {success:false,error:"Not in browser"}},async validateOnline(){},async deactivate(){return {success:false}},clear(){},getDaysRemaining(){const e=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(s);if(!e.expiresAt)return null;const r=new Date(e.expiresAt)-new Date;return Math.max(0,Math.ceil(r/(1e3*60*60*24)))},async getSubscriptionStatus(){return null},async setupAutoRenew(e){return {success:false,error:"Not in browser"}},async changeAutoRenewPlan(e){return {success:false,error:"Not in browser"}},getTopUpUrl(e){const r=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_0__.v)(s);if(!r.serverUrl||!r.license?.key)return null;let i=r.serverUrl;const t=new URLSearchParams;return t.set("license_key",r.license.key),e&&t.set("plan_id",String(e)),`${i}?${t.toString()}`},async toggleAutoRenew(e){return {success:false,error:"Not in browser"}}};


//# sourceMappingURL=licenseStore-CrqxulK0.js.map


/***/ }),

/***/ 25781:
/***/ ((__unused_webpack___webpack_module__, __unused_webpack___webpack_exports__, __webpack_require__) => {

/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);


const o=_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString().includes("$$")||/function \w+\(\) \{\}/.test(_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.g.toString());o&&new URL("https://example.com");
//# sourceMappingURL=state.svelte-xhjpmOz7.js.map


/***/ }),

/***/ 28980:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  lA: () => (/* binding */ invoke)
});

// UNUSED EXPORTS: Channel, PluginListener, Resource, SERIALIZE_TO_IPC_FN, addPluginListener, checkPermissions, convertFileSrc, isTauri, requestPermissions, transformCallback

;// CONCATENATED MODULE: ./node_modules/@tauri-apps/api/external/tslib/tslib.es6.js
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function tslib_es6_classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function tslib_es6_classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};



;// CONCATENATED MODULE: ./node_modules/@tauri-apps/api/core.js


// Copyright 2019-2024 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
var _Channel_onmessage, _Channel_nextMessageIndex, _Channel_pendingMessages, _Channel_messageEndIndex, _Resource_rid;
/**
 * Invoke your custom commands.
 *
 * This package is also accessible with `window.__TAURI__.core` when [`app.withGlobalTauri`](https://v2.tauri.app/reference/config/#withglobaltauri) in `tauri.conf.json` is set to `true`.
 * @module
 */
/**
 * A key to be used to implement a special function
 * on your types that define how your type should be serialized
 * when passing across the IPC.
 * @example
 * Given a type in Rust that looks like this
 * ```rs
 * #[derive(serde::Serialize, serde::Deserialize)
 * enum UserId {
 *   String(String),
 *   Number(u32),
 * }
 * ```
 * `UserId::String("id")` would be serialized into `{ String: "id" }`
 * and so we need to pass the same structure back to Rust
 * ```ts
 * import { SERIALIZE_TO_IPC_FN } from "@tauri-apps/api/core"
 *
 * class UserIdString {
 *   id
 *   constructor(id) {
 *     this.id = id
 *   }
 *
 *   [SERIALIZE_TO_IPC_FN]() {
 *     return { String: this.id }
 *   }
 * }
 *
 * class UserIdNumber {
 *   id
 *   constructor(id) {
 *     this.id = id
 *   }
 *
 *   [SERIALIZE_TO_IPC_FN]() {
 *     return { Number: this.id }
 *   }
 * }
 *
 * type UserId = UserIdString | UserIdNumber
 * ```
 *
 */
// if this value changes, make sure to update it in:
// 1. ipc.js
// 2. process-ipc-message-fn.js
const SERIALIZE_TO_IPC_FN = '__TAURI_TO_IPC_KEY__';
/**
 * Stores the callback in a known location, and returns an identifier that can be passed to the backend.
 * The backend uses the identifier to `eval()` the callback.
 *
 * @return An unique identifier associated with the callback function.
 *
 * @since 1.0.0
 */
function transformCallback(
// TODO: Make this not optional in v3
callback, once = false) {
    return window.__TAURI_INTERNALS__.transformCallback(callback, once);
}
class Channel {
    constructor(onmessage) {
        _Channel_onmessage.set(this, void 0);
        // the index is used as a mechanism to preserve message order
        _Channel_nextMessageIndex.set(this, 0);
        _Channel_pendingMessages.set(this, []);
        _Channel_messageEndIndex.set(this, void 0);
        tslib_es6_classPrivateFieldSet(this, _Channel_onmessage, onmessage || (() => { }), "f");
        this.id = transformCallback((rawMessage) => {
            const index = rawMessage.index;
            if ('end' in rawMessage) {
                if (index == tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")) {
                    this.cleanupCallback();
                }
                else {
                    tslib_es6_classPrivateFieldSet(this, _Channel_messageEndIndex, index, "f");
                }
                return;
            }
            const message = rawMessage.message;
            // Process the message if we're at the right order
            if (index == tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")) {
                tslib_es6_classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message);
                tslib_es6_classPrivateFieldSet(this, _Channel_nextMessageIndex, tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") + 1, "f");
                // process pending messages
                while (tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") in tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")) {
                    const message = tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")[tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")];
                    tslib_es6_classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message);
                    // eslint-disable-next-line @typescript-eslint/no-array-delete
                    delete tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")[tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f")];
                    tslib_es6_classPrivateFieldSet(this, _Channel_nextMessageIndex, tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") + 1, "f");
                }
                if (tslib_es6_classPrivateFieldGet(this, _Channel_nextMessageIndex, "f") === tslib_es6_classPrivateFieldGet(this, _Channel_messageEndIndex, "f")) {
                    this.cleanupCallback();
                }
            }
            // Queue the message if we're not
            else {
                // eslint-disable-next-line security/detect-object-injection
                tslib_es6_classPrivateFieldGet(this, _Channel_pendingMessages, "f")[index] = message;
            }
        });
    }
    cleanupCallback() {
        window.__TAURI_INTERNALS__.unregisterCallback(this.id);
    }
    set onmessage(handler) {
        tslib_es6_classPrivateFieldSet(this, _Channel_onmessage, handler, "f");
    }
    get onmessage() {
        return tslib_es6_classPrivateFieldGet(this, _Channel_onmessage, "f");
    }
    [(_Channel_onmessage = new WeakMap(), _Channel_nextMessageIndex = new WeakMap(), _Channel_pendingMessages = new WeakMap(), _Channel_messageEndIndex = new WeakMap(), SERIALIZE_TO_IPC_FN)]() {
        return `__CHANNEL__:${this.id}`;
    }
    toJSON() {
        // eslint-disable-next-line security/detect-object-injection
        return this[SERIALIZE_TO_IPC_FN]();
    }
}
class PluginListener {
    constructor(plugin, event, channelId) {
        this.plugin = plugin;
        this.event = event;
        this.channelId = channelId;
    }
    async unregister() {
        return invoke(`plugin:${this.plugin}|remove_listener`, {
            event: this.event,
            channelId: this.channelId
        });
    }
}
/**
 * Adds a listener to a plugin event.
 *
 * @returns The listener object to stop listening to the events.
 *
 * @since 2.0.0
 */
async function addPluginListener(plugin, event, cb) {
    const handler = new Channel(cb);
    return invoke(`plugin:${plugin}|registerListener`, { event, handler }).then(() => new PluginListener(plugin, event, handler.id));
}
/**
 * Get permission state for a plugin.
 *
 * This should be used by plugin authors to wrap their actual implementation.
 */
async function checkPermissions(plugin) {
    return invoke(`plugin:${plugin}|check_permissions`);
}
/**
 * Request permissions.
 *
 * This should be used by plugin authors to wrap their actual implementation.
 */
async function requestPermissions(plugin) {
    return invoke(`plugin:${plugin}|request_permissions`);
}
/**
 * Sends a message to the backend.
 * @example
 * ```typescript
 * import { invoke } from '@tauri-apps/api/core';
 * await invoke('login', { user: 'tauri', password: 'poiwe3h4r5ip3yrhtew9ty' });
 * ```
 *
 * @param cmd The command name.
 * @param args The optional arguments to pass to the command.
 * @param options The request options.
 * @return A promise resolving or rejecting to the backend response.
 *
 * @since 1.0.0
 */
async function invoke(cmd, args = {}, options) {
    return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
}
/**
 * Convert a device file path to an URL that can be loaded by the webview.
 * Note that `asset:` and `http://asset.localhost` must be added to [`app.security.csp`](https://v2.tauri.app/reference/config/#csp-1) in `tauri.conf.json`.
 * Example CSP value: `"csp": "default-src 'self' ipc: http://ipc.localhost; img-src 'self' asset: http://asset.localhost"` to use the asset protocol on image sources.
 *
 * Additionally, `"enable" : "true"` must be added to [`app.security.assetProtocol`](https://v2.tauri.app/reference/config/#assetprotocolconfig)
 * in `tauri.conf.json` and its access scope must be defined on the `scope` array on the same `assetProtocol` object.
 *
 * @param  filePath The file path.
 * @param  protocol The protocol to use. Defaults to `asset`. You only need to set this when using a custom protocol.
 * @example
 * ```typescript
 * import { appDataDir, join } from '@tauri-apps/api/path';
 * import { convertFileSrc } from '@tauri-apps/api/core';
 * const appDataDirPath = await appDataDir();
 * const filePath = await join(appDataDirPath, 'assets/video.mp4');
 * const assetUrl = convertFileSrc(filePath);
 *
 * const video = document.getElementById('my-video');
 * const source = document.createElement('source');
 * source.type = 'video/mp4';
 * source.src = assetUrl;
 * video.appendChild(source);
 * video.load();
 * ```
 *
 * @return the URL that can be used as source on the webview.
 *
 * @since 1.0.0
 */
function convertFileSrc(filePath, protocol = 'asset') {
    return window.__TAURI_INTERNALS__.convertFileSrc(filePath, protocol);
}
/**
 * A rust-backed resource stored through `tauri::Manager::resources_table` API.
 *
 * The resource lives in the main process and does not exist
 * in the Javascript world, and thus will not be cleaned up automatiacally
 * except on application exit. If you want to clean it up early, call {@linkcode Resource.close}
 *
 * @example
 * ```typescript
 * import { Resource, invoke } from '@tauri-apps/api/core';
 * export class DatabaseHandle extends Resource {
 *   static async open(path: string): Promise<DatabaseHandle> {
 *     const rid: number = await invoke('open_db', { path });
 *     return new DatabaseHandle(rid);
 *   }
 *
 *   async execute(sql: string): Promise<void> {
 *     await invoke('execute_sql', { rid: this.rid, sql });
 *   }
 * }
 * ```
 */
class Resource {
    get rid() {
        return __classPrivateFieldGet(this, _Resource_rid, "f");
    }
    constructor(rid) {
        _Resource_rid.set(this, void 0);
        __classPrivateFieldSet(this, _Resource_rid, rid, "f");
    }
    /**
     * Destroys and cleans up this resource from memory.
     * **You should not call any method on this object anymore and should drop any reference to it.**
     */
    async close() {
        return invoke('plugin:resources|close', {
            rid: this.rid
        });
    }
}
_Resource_rid = new WeakMap();
function isTauri() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    return !!(globalThis || window).isTauri;
}




/***/ })

};

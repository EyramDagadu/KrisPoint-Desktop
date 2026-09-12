export const id = 4422;
export const ids = [4422];
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

/***/ 74422:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ we)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(83230);
/* harmony import */ var _stores_CUt_qijU_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(5730);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(25781);
/* harmony import */ var _authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(88609);
/* harmony import */ var _ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(81561);
/* harmony import */ var _index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(72912);
/* harmony import */ var _licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(55056);










function i(){return "solo"}const t=i(),o=t==="solo",c=Object.freeze({collaboration:!o,multiUserAdministration:!o,sharedWorklist:!o,localVoiceLifecycle:o,localBackupRestore:o});

class Z{initialized=false;pollingInterval=null;presenceInterval=null;users=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)([]);messages=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)([]);unreadInfo=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)({totalUnread:0,unreadBySender:[]});selectedUserId=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)(null);isOpen=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)(false);isLoading=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)(false);totalUnread=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.E)(this.unreadInfo,s=>s.totalUnread);init(){this.initialized=true,this.startPolling(),this.updatePresence(true),this.startPresenceHeartbeat();}destroy(){this.stopPolling(),this.updatePresence(false),this.presenceInterval&&(clearInterval(this.presenceInterval),this.presenceInterval=null),this.initialized=false;}getFetchOptions(s="GET",e){const n={method:s,credentials:"include",headers:{"Content-Type":"application/json"}};return e&&(n.body=JSON.stringify(e)),n}startPolling(){this.fetchUsers(),this.fetchUnread(),this.pollingInterval=setInterval(()=>{this.fetchUnread();const s=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.v)(this.selectedUserId);s&&this.fetchMessages(s);},3e3);}stopPolling(){this.pollingInterval&&(clearInterval(this.pollingInterval),this.pollingInterval=null);}startPresenceHeartbeat(){this.presenceInterval=setInterval(()=>{this.updatePresence(true),this.fetchUsers();},3e4);}async fetchUsers(){if(this.initialized)try{const s=await fetch("/api/chat/users",this.getFetchOptions());if(s.ok){const e=await s.json();this.users.set(e.users||[]);}}catch(s){console.error("Failed to fetch chat users:",s);}}async fetchMessages(s){if(this.initialized)try{const e=await fetch(`/api/chat/messages/${s}`,this.getFetchOptions());if(e.ok){const n=await e.json();this.messages.set(n.messages||[]),await new Promise(a=>setTimeout(a,100)),await this.fetchUnread();}}catch(e){console.error("Failed to fetch messages:",e);}}async fetchUnread(){if(this.initialized)try{const s=await fetch("/api/chat/unread",this.getFetchOptions());if(s.ok){const e=await s.json();this.unreadInfo.set(e);}}catch(s){console.error("Failed to fetch unread:",s);}}async sendMessage(s,e){if(!this.initialized||!e.trim())return  false;try{const n=await fetch("/api/chat/messages",this.getFetchOptions("POST",{receiverId:s,content:e}));if(n.ok){const a=await n.json();return this.messages.update(l=>[...l,a.message]),!0}return !1}catch(n){return console.error("Failed to send message:",n),false}}async updatePresence(s){if(this.initialized)try{await fetch("/api/chat/presence",this.getFetchOptions("POST",{isOnline:s}));}catch(e){console.error("Failed to update presence:",e);}}selectUser(s){this.selectedUserId.set(s),this.fetchMessages(s);}clearSelection(){this.selectedUserId.set(null),this.messages.set([]),this.fetchUnread();}toggle(){(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.v)(this.isOpen)?this.close():this.open();}open(){this.selectedUserId.set(null),this.messages.set([]),this.isOpen.set(true),this.fetchUsers(),this.fetchUnread();}close(){this.isOpen.set(false),this.selectedUserId.set(null),this.messages.set([]);}}const y=new Z;function $(i,s){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e;let n;n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$isLoading",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.f)||true,n?(i.out.push("<!--[-->"),i.out.push(`<div class="auth-loading svelte-1ow98z2"><div class="loading-container svelte-1ow98z2"><div class="logo-container svelte-1ow98z2"><div class="logo-text svelte-1ow98z2">KrisPoint</div> <div class="logo-subtitle svelte-1ow98z2">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("Private Radiology Workstation")}</div></div> <div class="loading-spinner svelte-1ow98z2"></div> <p class="status-ready svelte-1ow98z2">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)("Opening your private workspace...")}</p></div></div>`)):(i.out.push("<!--[!-->"),i.out.push("<!---->"),i.out.push("<!---->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.W)(i,s,"default",{}),i.out.push("<!---->"),i.out.push("<!---->")),i.out.push("<!--]-->"),e&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function ee(i,s){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e;let n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(s.title,"KrisPoint"),a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(s.showUserInfo,true),l=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(s.showNewReportButton,false),u=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(s.sidebarCollapsed,false);function v(c){if(!c)return "DR";const p=c.split(" ");return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():c.substring(0,2).toUpperCase()}i.out.push(`<header class="header svelte-1o2w865"><div class="header-content svelte-1o2w865"><div class="header-left svelte-1o2w865"><button class="sidebar-toggle svelte-1o2w865" title="Toggle sidebar" aria-label="Toggle sidebar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"></path></svg></button> <h1 class="svelte-1o2w865">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(n)}</h1></div> <div class="header-actions svelte-1o2w865">`),l?(i.out.push("<!--[-->"),i.out.push('<button class="btn btn-primary svelte-1o2w865"><span class="btn-icon svelte-1o2w865">+</span> New Report</button>')):i.out.push("<!--[!-->"),i.out.push("<!--]--> "),a?(i.out.push("<!--[-->"),i.out.push(`<div class="user-info svelte-1o2w865"><div class="avatar svelte-1o2w865">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(v((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p)?.fullName))}</div> <div><div class="user-name svelte-1o2w865">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p)?.fullName||"Doctor")}</div> <div class="user-role svelte-1o2w865">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$currentUser",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.p)?.roleDisplayName||"Radiologist")}</div></div></div>`)):i.out.push("<!--[!-->"),i.out.push("<!--]--></div></div></header>"),e&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(s,{title:n,showUserInfo:a,showNewReportButton:l,sidebarCollapsed:u}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function se(i,s){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e;let n,a,l,u,v,c$2,p,r,O,z,m=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(s.collapsed,false),_=false;n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("users.manage"),a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("worklist.read"),l=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("reports.review"),u=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("reports.submit"),v=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("analytics.view"),c$2=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("reports.create"),p=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$permissions",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.h)?.includes("templates.read"),r=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$reportBadgeCounts",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.d).pendingReviews,O=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$reportBadgeCounts",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.d).returnedReports,z=[{id:"",label:"Home",icon:"🏠",badge:0},...a&&c.sharedWorklist?[{id:"worklist",label:"Worklist",icon:"📋",badge:0}]:[],...c$2?[{id:"reporting",label:"Continue Reporting",icon:"📝",badge:0}]:[],...l&&c.collaboration?[{id:"reports/pending-reviews",label:"Pending Reviews",icon:"✓",badge:r}]:[],...u&&c.collaboration?[{id:"reports/returned",label:"Returned Reports",icon:"↩️",badge:O}]:[],...c$2?[{id:"reports",label:"All Reports",icon:"📚",badge:0}]:[],...p?[{id:"templates",label:"Templates",icon:"📄",badge:0}]:[],...c$2?[{id:"macros",label:"Macros",icon:"⚡",badge:0}]:[],...v?[{id:"analytics",label:"Analytics",icon:"📊",badge:0}]:[],...n&&c.multiUserAdministration?[{id:"admin/users",label:"Users",icon:"👥",badge:0}]:[],...n?[{id:"admin/audit-logs",label:"Audit Logs",icon:"🔒",badge:0}]:[],...n?[{id:"admin/training-data",label:"Training Data",icon:"🎙️",badge:0}]:[],{id:"settings",label:"Settings",icon:"⚙️",badge:0}];let T=true,U;function A(t){const d=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.z)(z);t.out.push(`<div${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("sidebar svelte-s0e3bl",void 0,{collapsed:m})}><div class="sidebar-header svelte-s0e3bl"><div class="logo svelte-s0e3bl"><img src="/assets/branding/krispoint-logo-transparent.png" alt="KrisPoint Logo" class="logo-image svelte-s0e3bl"/> `),m?t.out.push("<!--[!-->"):(t.out.push("<!--[-->"),t.out.push('<h1 class="svelte-s0e3bl">KrisPoint</h1>')),t.out.push('<!--]--></div></div> <nav class="sidebar-nav svelte-s0e3bl"><!--[-->');for(let h=0,I=d.length;h<I;h++){let f=d[h];t.out.push(`<a${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("href",`/${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.U)(f.id)}`)}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.H)("nav-item svelte-s0e3bl",void 0,{active:(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$page",_stores_CUt_qijU_js__WEBPACK_IMPORTED_MODULE_2__.c).url.pathname===`/${f.id}`})}${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.u)("title",f.label)}><span class="icon-wrapper svelte-s0e3bl"><span class="icon svelte-s0e3bl">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(f.icon)}</span> `),f.badge>0&&m?(t.out.push("<!--[-->"),t.out.push('<span class="badge-dot svelte-s0e3bl"></span>')):t.out.push("<!--[!-->"),t.out.push("<!--]--></span> "),m?t.out.push("<!--[!-->"):(t.out.push("<!--[-->"),t.out.push(`<span class="label svelte-s0e3bl">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(f.label)}</span> `),f.badge>0?(t.out.push("<!--[-->"),t.out.push(`<span class="badge svelte-s0e3bl">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(f.badge>99?"99+":f.badge)}</span>`)):t.out.push("<!--[!-->"),t.out.push("<!--]-->")),t.out.push("<!--]--></a>");}t.out.push('<!--]--></nav> <div class="sidebar-footer svelte-s0e3bl"><button class="nav-item logout-btn svelte-s0e3bl" title="Logout"><span class="icon svelte-s0e3bl">🚪</span> '),m?t.out.push("<!--[!-->"):(t.out.push("<!--[-->"),t.out.push('<span class="label svelte-s0e3bl">Logout</span>')),t.out.push("<!--]--></button></div></div> "),(0,_ConfirmDialog_CDS_zF2t_js__WEBPACK_IMPORTED_MODULE_6__.p)(t,{title:"Logout?",message:"Are you sure you want to logout?",confirmText:"Logout",cancelText:"Cancel",get show(){return _},set show(h){_=h,T=false;}}),t.out.push("<!---->");}do T=true,U=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.r)(i),A(U);while(!T);(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.L)(i,U),e&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(s,{collapsed:m}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function te(i,s){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e$1;let n,a,l,u,v=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.o)(s.currentUserId,0);const{users:r,messages:O,selectedUserId:z,isOpen:m,totalUnread:_,unreadInfo:T}=y;let U="";(0,_index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__.e)(()=>{});function A(t){return u.unreadBySender?.find(h=>h.senderId===t)?.count||0}(0,_licenseStore_CrqxulK0_js__WEBPACK_IMPORTED_MODULE_8__.p)("chat"),n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$1??={},"$usersStore",r),a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$1??={},"$messagesStore",O),l=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$1??={},"$selectedUserIdStore",z),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$1??={},"$isOpenStore",m),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$1??={},"$totalUnreadStore",_),u=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$1??={},"$unreadInfoStore",T),n.find(t=>t.id===l),n.filter(t=>{if(!U.trim())return  true;const d=U.toLowerCase(),h=(t.fullName||"").toLowerCase(),I=(t.title||"").toLowerCase();return h.includes(d)||I.includes(d)}).sort((t,d)=>{const h=A(t.id),I=A(d.id);return h!==I?I-h:t.isOnline!==d.isOnline?(d.isOnline?1:0)-(t.isOnline?1:0):(t.fullName||"").localeCompare(d.fullName||"")}),a&&a.length,i.out.push("<!--[!-->"),i.out.push("<!--]-->"),e$1&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e$1),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.t)(s,{currentUserId:v}),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}const ie=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)(false),re=(0,_index_DNKSM4PU_js__WEBPACK_IMPORTED_MODULE_7__.z)(0);function ne(i,s){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e;function n(a){const l=Math.floor(a/60),u=a%60;return l>0?`${l}:${u.toString().padStart(2,"0")}`:`${u}s`}(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$showIdleWarning",ie)?(i.out.push("<!--[-->"),i.out.push(`<div class="idle-overlay svelte-1tl6t9m"><div class="idle-modal svelte-1tl6t9m"><div class="idle-icon svelte-1tl6t9m"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div> <h2 class="svelte-1tl6t9m">Session Timeout Warning</h2> <p class="idle-message svelte-1tl6t9m">Your session will expire due to inactivity in</p> <div class="countdown svelte-1tl6t9m">${(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.n)(n((0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e??={},"$idleTimeRemaining",re)))}</div> <p class="idle-submessage svelte-1tl6t9m">Move your mouse or press any key to continue.</p></div></div>`)):i.out.push("<!--[!-->"),i.out.push("<!--]-->"),e&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}function we(i,s){(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__._)();var e$2;let n,a,l,u,v,c$2=true;function p(r){return {"/":"KrisPoint Dashboard","/analytics":"Analytics","/worklist":"Worklist","/reporting":"Report Editor","/reports":"All Reports","/reports/pending-reviews":"Pending Reviews","/reports/returned":"Returned Reports","/templates":"Templates","/macros":"Macros","/settings":"Settings","/admin/users":"User Management","/admin/audit-logs":"Audit Logs","/admin/training-data":"Training Data","/admin/analytics":"Admin Analytics"}[r]||"KrisPoint"}(0,_index_server_B0jzk0X3_js__WEBPACK_IMPORTED_MODULE_1__.e)(()=>{}),n=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$2??={},"$authState",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.e).isAuthenticated,a=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$2??={},"$authState",_authStore_wTOTagk_js__WEBPACK_IMPORTED_MODULE_5__.e).currentUser?.id||0,l=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.G)(e$2??={},"$page",_stores_CUt_qijU_js__WEBPACK_IMPORTED_MODULE_2__.c)?.url?.pathname||"/",u=l==="/auth",v=p(l),i.out.push("<!--[!-->"),i.out.push("<!--]--> "),$(i,{children:r=>{u?(r.out.push("<!--[-->"),r.out.push("<!---->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.W)(r,s,"default",{}),r.out.push("<!---->")):(r.out.push("<!--[!-->"),r.out.push('<div class="app-layout svelte-lfc847">'),se(r,{collapsed:c$2}),r.out.push('<!----> <div class="main-content svelte-lfc847">'),ee(r,{title:v,showUserInfo:true,showNewReportButton:false,sidebarCollapsed:c$2}),r.out.push('<!----> <main class="content-area svelte-lfc847"><!---->'),r.out.push("<!---->"),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.W)(r,s,"default",{}),r.out.push("<!---->"),r.out.push("<!----></main></div></div> "),n?(r.out.push("<!--[-->"),c.collaboration?(r.out.push("<!--[-->"),te(r,{currentUserId:a})):r.out.push("<!--[!-->"),r.out.push("<!--]--> "),ne(r),r.out.push("<!---->")):r.out.push("<!--[!-->"),r.out.push("<!--]-->")),r.out.push("<!--]-->");},$$slots:{default:true}}),i.out.push("<!---->"),e$2&&(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.l)(e$2),(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.f)();}


//# sourceMappingURL=_layout.svelte-dBcZtZ1p.js.map


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

/***/ 5730:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   c: () => (/* binding */ c)
/* harmony export */ });
/* harmony import */ var _index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(98579);
/* harmony import */ var _utils_Ca_EoiSx_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(79936);
/* harmony import */ var _state_svelte_xhjpmOz7_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(25781);




const s=()=>{const t=(0,_index2_CY1CdFeX_js__WEBPACK_IMPORTED_MODULE_0__.x)("__svelte__");return {page:{subscribe:t.page.subscribe},navigating:{subscribe:t.navigating.subscribe},updated:t.updated}},c={subscribe(t){return s().page.subscribe(t)}};


//# sourceMappingURL=stores-CUt_qijU.js.map


/***/ })

};

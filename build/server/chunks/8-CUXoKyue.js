import { r as redirect } from './index-Djsj11qr.js';
import { a as C } from './auth-CFRsUa-j.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const U=async({cookies:e,url:t,fetch:f})=>{const p=e.get("session_token");if(!p)throw redirect(303,"/login");const i=await C(p);if(!i.success||!i.user)throw redirect(303,"/login");const a=i.user,n=a.roleName?.toLowerCase()||"";if(n==="front desk")throw redirect(303,"/dashboard");const y=n==="admin"||n==="owner"||n==="system owner",o=t.searchParams.get("startDate")||I(),r=t.searchParams.get("endDate")||R(),l=t.searchParams.get("preset")||"30days",c=t.searchParams.get("userId")||"all",d=t.searchParams.get("modality")||"all",m=t.searchParams.get("status")||"all";let g=`/api/analytics/user?period=custom&startDate=${o}&endDate=${r}`;l==="all"&&(g="/api/analytics/user?period=all");const D=await(await f(g)).json();let w=null;if(y){let s=`/api/analytics/admin?period=custom&startDate=${o}&endDate=${r}`;l==="all"&&(s="/api/analytics/admin?period=all"),c!=="all"&&(s+=`&userId=${c}`),d!=="all"&&(s+=`&modality=${encodeURIComponent(d)}`),m!=="all"&&(s+=`&status=${m}`);const h=await(await f(s)).json();h.success&&(w=h.data);}return {userAnalytics:D.success?D.data:null,adminAnalytics:w,isAdmin:y,filters:{startDate:o,endDate:r,preset:l,userId:c,modality:d,status:m},user:{id:a.id,username:a.username,roleName:a.roleName}}};function I(){const e=new Date;return e.setMonth(e.getMonth()-1),e.toISOString().split("T")[0]}function R(){return new Date().toISOString().split("T")[0]}

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: U
});

const index = 8;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BxtEbxXj.js')).default;
const universal = {
  "prerender": false,
  "ssr": false
};
const universal_id = "src/routes/analytics/+page.js";
const server_id = "src/routes/analytics/+page.server.ts";
const imports = ["_app/immutable/nodes/8.DT6ZS746.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DCCa7WY_.js","_app/immutable/chunks/D5gQvCjn.js","_app/immutable/chunks/TxzGf9kf.js","_app/immutable/chunks/D3a4_bll.js","_app/immutable/chunks/CR6m4V62.js","_app/immutable/chunks/Crmhr63z.js","_app/immutable/chunks/DVVrJoQm.js","_app/immutable/chunks/BvBU9x--.js","_app/immutable/chunks/C4glEofd.js","_app/immutable/chunks/BZIGDFf3.js","_app/immutable/chunks/Cr9GWNwF.js","_app/immutable/chunks/CPF_VgrF.js","_app/immutable/chunks/ZlLAuBRx.js","_app/immutable/chunks/C5VKH-05.js","_app/immutable/chunks/BZXIp3h8.js"];
const stylesheets = ["_app/immutable/assets/DateFilterDropdown.D9YbXaKS.css","_app/immutable/assets/8.MnV_QRbx.css"];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets, universal, universal_id };
//# sourceMappingURL=8-CUXoKyue.js.map

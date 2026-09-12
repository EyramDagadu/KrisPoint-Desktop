import { _ as _e, G as Ge, z as ze, J as Be, u as je, Z as Ze, n as Ot, l as Ve, f as ve } from './index2-CY1CdFeX.js';
import './utils-Ca-EoiSx.js';
import './state.svelte-xhjpmOz7.js';
import { h } from './authStore-_wTOTagk.js';
import './index-DNKSM4PU.js';

function U(s,d){_e();var t;let m=[],c="",h$1="";Ge(t??={},"$permissions",h)?.includes("users.manage"),Ge(t??={},"$permissions",h)?.includes("users.delete");const i=ze(m);Be(s,e=>{e.title="<title>User Management - KrisPoint Admin</title>";}),s.out.push('<div class="admin-container svelte-1tjm7uo"><div class="page-header svelte-1tjm7uo"><button class="btn-primary svelte-1tjm7uo"><span class="btn-icon svelte-1tjm7uo">+</span> Add New User</button></div> '),s.out.push("<!--[!-->"),s.out.push(`<!--]--> <div class="filters-bar svelte-1tjm7uo"><div class="search-box svelte-1tjm7uo"><input type="text" placeholder="Search users..."${je("value",c)} class="svelte-1tjm7uo"/></div> <select class="filter-select svelte-1tjm7uo">`),s.select_value=h$1,s.out.push(`<option value=""${Ze(s,"")}>All Roles</option><!--[-->`);for(let e=0,p=i.length;e<p;e++){let u=i[e];s.out.push(`<option${je("value",u.name)}${Ze(s,u.name)}>${Ot(u.displayName)}</option>`);}s.out.push("<!--]-->"),s.select_value=void 0,s.out.push("</select></div> "),s.out.push("<!--[-->"),s.out.push('<div class="loading-state svelte-1tjm7uo"><div class="spinner svelte-1tjm7uo"></div> <p>Loading users...</p></div>'),s.out.push("<!--]--></div> "),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[!-->"),s.out.push("<!--]-->"),t&&Ve(t),ve();}

export { U as default };
//# sourceMappingURL=_page.svelte-BnvPhqgw.js.map

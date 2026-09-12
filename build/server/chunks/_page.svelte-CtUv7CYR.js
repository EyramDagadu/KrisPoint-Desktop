import { _ as _e, u as je, n as Ot, f as ve } from './index2-CY1CdFeX.js';

function h(s,o){_e();let t=[],r=true;t.reduce((u,e)=>(u[e.userId]||(u[e.userId]={userName:e.userName,username:e.username,roleName:e.roleName,sessions:[]}),u[e.userId].sessions.push(e),u),{}),s.out.push(`<div class="sessions-page svelte-vxcud3"><div class="page-header svelte-vxcud3"><h1 class="svelte-vxcud3">Active Sessions</h1> <button class="refresh-btn svelte-vxcud3"${je("disabled",r,true)}>${Ot("Loading...")}</button></div> `),s.out.push("<!--[!-->"),s.out.push("<!--]--> "),s.out.push("<!--[-->"),s.out.push('<div class="loading svelte-vxcud3">Loading sessions...</div>'),s.out.push("<!--]--></div>"),ve();}

export { h as default };
//# sourceMappingURL=_page.svelte-CtUv7CYR.js.map

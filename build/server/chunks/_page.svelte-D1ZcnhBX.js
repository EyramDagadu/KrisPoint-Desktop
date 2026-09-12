import { _ as _e, G as Ge, z as ze, Z as Ze, u as je, n as Ot, H as He, l as Ve, f as ve } from './index2-CY1CdFeX.js';
import { e } from './index-server-B0jzk0X3.js';
import './utils-Ca-EoiSx.js';
import './state.svelte-xhjpmOz7.js';
import { h } from './authStore-_wTOTagk.js';
import { _ } from './DateFilterDropdown-CmsvNQjW.js';
import { t } from './SSEManager-DiJ-NMik.js';
import './index-DNKSM4PU.js';

function v(e){return e?{ct:"CT",mri:"MRI",xray:"X-Ray",us:"Ultrasound",mg:"Mammography",fl:"Fluoroscopy",nm:"Nuclear Medicine"}[e.toLowerCase()]||P(e):""}function P(e){return e?e.charAt(0).toUpperCase()+e.slice(1).toLowerCase():""}function q(e$1,m){_e();var r;let o,l;const p="pending-reviews";let d=[],h$1=[],g="mine",f="",M="",_$1="",b="all",n="card";const j=["CT","MRI","X-Ray","Ultrasound","Mammography","Fluoroscopy","Nuclear Medicine","PET-CT"];e(()=>{t.unregister(p);}),Ge(r??={},"$permissions",h).includes("reports.review"),o=d.filter(t=>(v(t.modality),true)),l=h$1.filter(t=>(v(t.modality),true)),o.length+l.length;const a=ze(j);e$1.out.push('<div class="pending-reviews-page svelte-nj9uru"><div class="page-controls svelte-nj9uru"><select class="filter-select svelte-nj9uru">'),e$1.select_value=g,e$1.out.push(`<option value="mine"${Ze(e$1,"mine")} class="svelte-nj9uru">Assigned to Me</option><option value="all"${Ze(e$1,"all")} class="svelte-nj9uru">All Pending Reviews</option>`),e$1.select_value=void 0,e$1.out.push("</select> "),_(e$1,{startDate:M,endDate:_$1,selectedPreset:b}),e$1.out.push('<!----> <select class="modality-filter svelte-nj9uru">'),e$1.select_value=f,e$1.out.push(`<option value=""${Ze(e$1,"")} class="svelte-nj9uru">All Modalities</option><!--[-->`);for(let t=0,u=a.length;t<u;t++){let i=a[t];e$1.out.push(`<option${je("value",i)}${Ze(e$1,i)} class="svelte-nj9uru">${Ot(i)}</option>`);}e$1.out.push("<!--]-->"),e$1.select_value=void 0,e$1.out.push("</select> "),e$1.out.push("<!--[!-->"),e$1.out.push(`<!--]--> <div class="view-toggle svelte-nj9uru"><button${He("toggle-btn svelte-nj9uru",void 0,{active:n==="card"})} title="Card View">▦</button> <button${He("toggle-btn svelte-nj9uru",void 0,{active:n==="table"})} title="Table View">☰</button></div></div> `),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]--> "),e$1.out.push("<!--[-->"),e$1.out.push('<div class="loading svelte-nj9uru">Loading pending reviews...</div>'),e$1.out.push("<!--]--></div> "),e$1.out.push("<!--[!-->"),e$1.out.push("<!--]-->"),r&&Ve(r),ve();}

export { q as default };
//# sourceMappingURL=_page.svelte-D1ZcnhBX.js.map

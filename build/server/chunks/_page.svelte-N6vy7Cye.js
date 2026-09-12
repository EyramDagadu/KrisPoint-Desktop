import { _ as _e, J as Be, u as je, n as Ot, H as He, f as ve } from './index2-CY1CdFeX.js';
import './utils-Ca-EoiSx.js';
import './state.svelte-xhjpmOz7.js';
import { p as p$1 } from './ConfirmDialog-CDS_zF2t.js';
import { U } from './PremiumGate-C8BMj57k.js';
import { p } from './licenseStore-CrqxulK0.js';
import './index-DNKSM4PU.js';

function A(e,T){_e();let i,u,r,p$2=[],m="",n=false,h=false,o="system";i=p("templates"),u=p$2,u.reduce((t,a)=>{const s=a.category||"general";return t[s]||(t[s]=[]),t[s].push(a),t},{}),r=h,Be(e,t=>{t.title="<title>Report Templates - KrisPoint</title>";}),i?(e.out.push("<!--[!-->"),e.out.push(`<div class="templates-page svelte-1d2gjz1"><div class="page-header svelte-1d2gjz1"><p class="svelte-1d2gjz1">Professional radiology report templates for faster reporting</p> <div class="header-actions svelte-1d2gjz1"><div class="search-box svelte-1d2gjz1"><input type="text" placeholder="Search templates..."${je("value",m)} class="search-input svelte-1d2gjz1"/></div> `),r?(e.out.push("<!--[-->"),e.out.push(`<button class="btn btn-primary svelte-1d2gjz1"><span>+</span> Create ${Ot("System")} Template</button>`)):e.out.push("<!--[!-->"),e.out.push(`<!--]--></div></div> <div class="tabs svelte-1d2gjz1"><button${He("tab svelte-1d2gjz1",void 0,{active:o==="system"})}>System Templates</button> <button${He("tab svelte-1d2gjz1",void 0,{active:o==="personal"})}>My Templates</button></div> `),e.out.push("<!--[-->"),e.out.push('<div class="loading-state svelte-1d2gjz1"><div class="spinner svelte-1d2gjz1"></div> <p>Loading templates...</p></div>'),e.out.push("<!--]--></div> "),e.out.push("<!--[!-->"),e.out.push("<!--]--> "),e.out.push("<!--[!-->"),e.out.push("<!--]--> "),p$1(e,{show:n,title:"Delete Template",message:"Are you sure you want to delete this template? This action cannot be undone.",confirmText:"Delete",confirmClass:"danger"}),e.out.push("<!---->")):(e.out.push("<!--[-->"),e.out.push('<div class="templates-page svelte-1d2gjz1">'),U(e,{feature:"templates"}),e.out.push("<!----></div>")),e.out.push("<!--]-->"),ve();}

export { A as default };
//# sourceMappingURL=_page.svelte-N6vy7Cye.js.map

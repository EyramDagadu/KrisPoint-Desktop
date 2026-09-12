import { _ as _e, o as be, G as Ge, W as We, H as He, n as Ot, l as Ve, t as Xe, f as ve } from './index2-CY1CdFeX.js';
import { p, o, f } from './licenseStore-CrqxulK0.js';
import './utils-Ca-EoiSx.js';
import './state.svelte-xhjpmOz7.js';

function U(s,e){_e();var t;let o$1,i=be(e.feature,""),c=be(e.showUpgradePrompt,true),p$1=be(e.compact,false);const a={voice:"Voice Dictation",ai_polish:"AI Report Polish",chat:"Inter-User Chat",templates:"Templates",macros:"Macros"};o$1=!i||p(i),Ge(t??={},"$isLicenseActive",o)&&o$1?(s.out.push("<!--[-->"),s.out.push("<!---->"),We(s,e,"default",{}),s.out.push("<!---->")):(s.out.push("<!--[!-->"),c?(s.out.push("<!--[-->"),s.out.push(`<div${He("premium-gate svelte-zskbsf",void 0,{compact:p$1})}><div class="premium-icon svelte-zskbsf">${Ot(Ge(t??={},"$isLicenseExpired",f)?"⏰":"🔒")}</div> <div class="premium-content svelte-zskbsf"><h4 class="svelte-zskbsf">${Ot(a[i]||"Premium Feature")}</h4> `),Ge(t??={},"$isLicenseExpired",f)?(s.out.push("<!--[-->"),s.out.push('<p class="svelte-zskbsf">Your license has expired. Renew to continue using this feature.</p> <button class="upgrade-btn renew-btn svelte-zskbsf">Renew License</button>')):(s.out.push("<!--[!-->"),s.out.push('<p class="svelte-zskbsf">This feature requires a premium license.</p> <button class="upgrade-btn svelte-zskbsf">Upgrade Now</button>')),s.out.push("<!--]--></div></div>")):s.out.push("<!--[!-->"),s.out.push("<!--]-->")),s.out.push("<!--]-->"),t&&Ve(t),Xe(e,{feature:i,showUpgradePrompt:c,compact:p$1}),ve();}

export { U };
//# sourceMappingURL=PremiumGate-C8BMj57k.js.map

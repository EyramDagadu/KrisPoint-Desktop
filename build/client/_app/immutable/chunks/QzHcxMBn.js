import{invoke as m}from"./DV6XEvTN.js";const f={BASE_URL:"./",DEV:!1,MODE:"production",PROD:!0,SSR:!1};class T{constructor(){this.baseUrl=this.getOllamaUrl(),this.model="mistral:7b",this.isAvailable=!1,this._isTauriRuntime=null}getOllamaUrl(){if(typeof window<"u"){const s=window.location.hostname;if(s!=="localhost"&&s!=="127.0.0.1")return console.log(`🤖 Ollama URL set to server IP: http://${s}:11434`),`http://${s}:11434`}return"http://localhost:11434"}isTauriRuntime(){return this._isTauriRuntime!==null?this._isTauriRuntime:typeof window<"u"&&!!(window.__TAURI_INTERNALS__||window.__TAURI__?.core)?(console.log("✅ Tauri desktop app detected (host: "+window.location.hostname+")"),this._isTauriRuntime=!0,!0):(console.log("🌐 Browser/dev mode detected (host: "+window.location.hostname+")"),this._isTauriRuntime=!1,!1)}async makeRequest(s,e={}){if(this.isTauriRuntime()){console.log("🖥️ Using Tauri backend HTTP proxy (CORS-free)"),console.log("📤 Request:",{url:s,method:e.method,headers:e.headers});try{console.log("⏳ Waiting for Tauri backend response...");const t=await m("http_request",{request:{url:s,method:e.method||"GET",headers:e.headers||{},body:e.body||null}});return console.log("✅ Tauri backend response received:",{status:t.status,bodyLength:t.body?.length||0}),{ok:t.status>=200&&t.status<300,status:t.status,statusText:t.status===200?"OK":"Error",headers:t.headers,text:async()=>t.body,json:async()=>JSON.parse(t.body)}}catch(t){throw console.error("❌ Tauri backend error:",t),new Error(`Tauri HTTP request failed: ${t.message||t}`)}}else return console.log("🌐 Using browser fetch"),fetch(s,e)}async checkAvailability(){const s=this.isTauriRuntime();console.log("🔍 Checking Ollama availability...",{isTauri:s,baseUrl:this.baseUrl});try{console.log("📡 Sending request to:",`${this.baseUrl}/api/tags`);const e=await this.makeRequest(`${this.baseUrl}/api/tags`,{method:"GET",headers:{Accept:"application/json","Content-Type":"application/json"}});if(console.log("📥 Ollama response:",{status:e.status,ok:e.ok,statusText:e.statusText}),!e.ok)try{await e.text()}catch{}return this.isAvailable=e.ok||e.status===200,this.isAvailable?console.log("✅ Ollama is available and running"):console.warn("⚠️ Ollama responded but not OK:",e.status),this.isAvailable}catch(e){return console.error("❌ Ollama availability check failed:",{message:e.message}),this.isAvailable=!1,!1}}setConfig(s,e){this.baseUrl=s||"http://localhost:11434",this.model=e||"mistral:7b"}getConfig(){return{baseUrl:this.baseUrl,model:this.model}}stripHtml(s){if(!s)return"";let e=s.replace(/<br\s*\/?>/gi,`
`).replace(/<\/p>/gi,`
`).replace(/<\/div>/gi,`
`).replace(/<\/li>/gi,`
`).replace(/<\/tr>/gi,`
`).replace(/<\/h[1-6]>/gi,`
`);return e=e.replace(/<[^>]*>/g,""),e=e.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&bull;/gi,"•"),e=e.replace(/\n\s*\n\s*\n/g,`

`).trim(),e}async smartRefine(s,e,t,n,i=null){if(!this.isAvailable)throw new Error("Ollama is not running. Please start Ollama and try again.");const a=this.stripHtml(s),l=this.stripHtml(e);return console.log("🧹 Stripped HTML from content:",{originalLength:s.length,cleanLength:a.length,hadHtml:s.includes("<")}),this.analyzeCompleteness(a).isComplete?this.polishReport(a,i):this.generateFullReport(a,l,t,i)}async generateFullReport(s,e,t="General",n=null){if(!this.isAvailable)throw new Error("Ollama is not running.");const i=`You are a professional radiologist report writer. Your task is ONLY to rewrite findings into a structured radiology report.

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
   Clinical Indication: ${e||"Not provided"}
   Report Type: ${t}
   Raw Findings: ${s}

CRITICAL: Output the report structure EXACTLY as shown above. Do not add any extra text before or after.`;return this.callOllama(i,n)}async polishReport(s,e=null){if(!this.isAvailable)throw new Error("Ollama is not running.");const t=`You are a professional radiologist editor. Your task is ONLY to improve the language and clarity of a radiology report.

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

CRITICAL: Output the complete polished report with ALL sections intact. Make NO structural changes.`;return this.callOllama(t,e)}async generateImpression(s,e){if(!this.isAvailable)throw new Error("Ollama is not running.");const t=this.stripHtml(s),n=this.stripHtml(e),i=`You are a radiologist creating an impression for a medical report.

STRICT RULES:
1. Output ONLY the impression text - nothing else
2. Impression MUST be based ONLY on the provided findings
3. Impression must be 1-3 sentences, concise and professional
4. Use definitive language (not speculative like "suggestive of", "cannot exclude")
5. If findings are normal, state normal and list the study type
6. If findings are abnormal, state the findings and their clinical relevance

INPUT:
Clinical Indication: ${t||"Not provided"}
Findings: ${n}

CRITICAL: Respond with ONLY the impression text. No labels, no extra text. Start directly with the impression.`;return this.callOllama(i)}async callOllama(s,e=null){try{let t="";const n={model:this.model,prompt:s,stream:!0,temperature:.3},i=this.isTauriRuntime();console.log("🚀 Ollama request:",{isTauri:i,url:`${this.baseUrl}/api/generate`,model:this.model,fetchType:i?"Tauri backend proxy (no streaming)":"Browser fetch (streaming)",env:f?.TAURI_PLATFORM||"browser"});const a=await this.makeRequest(`${this.baseUrl}/api/generate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)});if(console.log("📥 Ollama response:",{ok:a.ok,status:a.status,statusText:a.statusText,headers:a.headers}),!a.ok){const l=await a.text();throw console.error("❌ Ollama error response:",l),new Error(`Ollama API error: ${a.status} ${a.statusText}`)}if(i){console.log("🖥️ Tauri mode: Getting full response (no streaming)");const c=(await a.text()).split(`
`).filter(o=>o.trim());for(const o of c)try{const r=JSON.parse(o);r.response&&(t+=r.response)}catch{}e&&t&&(console.log("✅ Full response ready, length:",t.length),e(t))}else{const l=a.body.getReader(),c=new TextDecoder;let o="";for(;;){const{done:r,value:h}=await l.read();if(r)break;const g=c.decode(h,{stream:!0});o+=g;const d=o.split(`
`);o=d.pop()||"";for(const u of d)if(u.trim())try{const p=JSON.parse(u);p.response&&(t+=p.response,e&&e(t))}catch(p){console.warn("JSON parse error:",p.message)}}if(o.trim())try{const r=JSON.parse(o);r.response&&(t+=r.response,e&&e(t))}catch{}}return console.log("✅ Ollama generation complete, total length:",t.length),t.trim()}catch(t){throw console.error("❌ Ollama API error:",{message:t.message,stack:t.stack,name:t.name}),t}}analyzeCompleteness(s){const e=/COMPARISON:/i.test(s),t=/TECHNIQUE:/i.test(s),n=/FINDINGS:/i.test(s),i=/IMPRESSION:/i.test(s),a=s.replace(/\s+/g," ").length,l=a>300;return{isComplete:t&&n&&i&&l,sections:{hasComparison:e,hasTechnique:t,hasFindings:n,hasImpression:i},contentLength:a}}}const y=new T;export{y as o};

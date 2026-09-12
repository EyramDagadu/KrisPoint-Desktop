import{invoke as h}from"@tauri-apps/api/core";const f={BASE_URL:"/",DEV:!1,MODE:"production",PROD:!0,SSR:!0};class T{constructor(){this.baseUrl=this.getOllamaUrl(),this.model="mistral:7b",this.isAvailable=!1,this._isTauriRuntime=null}getOllamaUrl(){if(typeof window<"u"){const s=window.location.hostname;if(s!=="localhost"&&s!=="127.0.0.1")return console.log(`🤖 Ollama URL set to server IP: http://${s}:11434`),`http://${s}:11434`}return"http://localhost:11434"}isTauriRuntime(){return this._isTauriRuntime!==null?this._isTauriRuntime:typeof window<"u"&&!!(window.__TAURI_INTERNALS__||window.__TAURI__?.core)?(console.log("✅ Tauri desktop app detected (host: "+window.location.hostname+")"),this._isTauriRuntime=!0,!0):(console.log("🌐 Browser/dev mode detected (host: "+window.location.hostname+")"),this._isTauriRuntime=!1,!1)}async makeRequest(s,t={}){if(this.isTauriRuntime()){console.log("🖥️ Using Tauri backend HTTP proxy (CORS-free)"),console.log("📤 Request:",{url:s,method:t.method,headers:t.headers});try{console.log("⏳ Waiting for Tauri backend response...");const e=await h("http_request",{request:{url:s,method:t.method||"GET",headers:t.headers||{},body:t.body||null}});return console.log("✅ Tauri backend response received:",{status:e.status,bodyLength:e.body?.length||0}),{ok:e.status>=200&&e.status<300,status:e.status,statusText:e.status===200?"OK":"Error",headers:e.headers,text:async()=>e.body,json:async()=>JSON.parse(e.body)}}catch(e){throw console.error("❌ Tauri backend error:",e),new Error(`Tauri HTTP request failed: ${e.message||e}`)}}else return console.log("🌐 Using browser fetch"),fetch(s,t)}async checkAvailability(){return!1}setConfig(s,t){this.baseUrl=s||"http://localhost:11434",this.model=t||"mistral:7b"}getConfig(){return{baseUrl:this.baseUrl,model:this.model}}stripHtml(s){if(!s)return"";let t=s.replace(/<br\s*\/?>/gi,`
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
`).filter(a=>a.trim());for(const a of c)try{const o=JSON.parse(a);o.response&&(e+=o.response)}catch{}t&&e&&(console.log("✅ Full response ready, length:",e.length),t(e))}else{const l=n.body.getReader(),c=new TextDecoder;let a="";for(;;){const{done:o,value:m}=await l.read();if(o)break;const g=c.decode(m,{stream:!0});a+=g;const d=a.split(`
`);a=d.pop()||"";for(const u of d)if(u.trim())try{const p=JSON.parse(u);p.response&&(e+=p.response,t&&t(e))}catch(p){console.warn("JSON parse error:",p.message)}}if(a.trim())try{const o=JSON.parse(a);o.response&&(e+=o.response,t&&t(e))}catch{}}return console.log("✅ Ollama generation complete, total length:",e.length),e.trim()}catch(e){throw console.error("❌ Ollama API error:",{message:e.message,stack:e.stack,name:e.name}),e}}analyzeCompleteness(s){const t=/COMPARISON:/i.test(s),e=/TECHNIQUE:/i.test(s),i=/FINDINGS:/i.test(s),r=/IMPRESSION:/i.test(s),n=s.replace(/\s+/g," ").length,l=n>300;return{isComplete:e&&i&&r&&l,sections:{hasComparison:t,hasTechnique:e,hasFindings:i,hasImpression:r},contentLength:n}}}const I=new T;export{I as o};

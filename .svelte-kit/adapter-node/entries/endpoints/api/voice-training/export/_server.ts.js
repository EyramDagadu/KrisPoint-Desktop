import{d as x,v as s,u as f}from"../../../../../chunks/db.js";import{eq as h,and as O}from"drizzle-orm";import{readFile as N}from"fs/promises";import{existsSync as C}from"fs";import _ from"path";import j from"archiver";import{a as R,c as A,l as P}from"../../../../../chunks/auth.js";const B=async({cookies:v})=>{const g=v.get("session_token");if(!g)return new Response(JSON.stringify({success:!1,error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});const i=await R(g);if(!i.success||!i.user)return new Response(JSON.stringify({success:!1,error:"Unauthorized"}),{status:401,headers:{"Content-Type":"application/json"}});if(!await A(i.user.id,"training.export"))return new Response(JSON.stringify({success:!1,error:"Only the System Owner can export training data"}),{status:403,headers:{"Content-Type":"application/json"}});try{const r=await x.select({id:s.id,userId:s.userId,speakerName:f.fullName,audioPath:s.audioPath,verifiedTranscript:s.verifiedTranscript,rawTranscript:s.rawTranscript}).from(s).innerJoin(f,h(s.userId,f.id)).where(O(h(s.isUsable,!0),h(s.isReviewed,!0)));if(r.length===0)return new Response(JSON.stringify({success:!1,error:"No reviewed training samples available for export"}),{status:404,headers:{"Content-Type":"application/json"}});const a={};for(const p of r){const o=`speaker_${p.userId}`;a[o]||(a[o]=[]),a[o].push(p)}const k=await new Promise(async(p,o)=>{const T=[],t=j("zip",{zlib:{level:6}});t.on("data",e=>{T.push(e)}),t.on("end",()=>{p(Buffer.concat(T))}),t.on("error",e=>{o(e)});for(const[e,u]of Object.entries(a)){let c="",d="",y="";for(const n of u){const l=`${e}_${n.id}`,S=n.verifiedTranscript||n.rawTranscript||"";if(c+=`${l} ${S}
`,d+=`${l} ${e}/audio/${n.id}.wav
`,y+=`${l} ${e}
`,n.audioPath){const $=_.join(process.cwd(),n.audioPath);if(C($))try{const m=await N($);t.append(m,{name:`${e}/audio/${n.id}.wav`})}catch(m){console.error("Failed to read audio file:",m)}}}t.append(c,{name:`${e}/text.txt`}),t.append(d,{name:`${e}/wav.scp`}),t.append(y,{name:`${e}/utt2spk`})}let w="";for(const[e,u]of Object.entries(a)){const c=u.map(d=>`${e}_${d.id}`).join(" ");w+=`${e} ${c}
`}t.append(w,{name:"spk2utt"});const I=`Kaldi Training Data Export
========================

This archive contains voice training data exported from KrisPoint Medical.

Structure:
- speaker_<id>/
  - audio/          : WAV audio files (16kHz mono)
  - text.txt        : Transcriptions (utterance_id transcript)
  - wav.scp         : Audio file paths (utterance_id path)
  - utt2spk         : Utterance to speaker mapping
- spk2utt           : Speaker to utterances mapping

Total speakers: ${Object.keys(a).length}
Total samples: ${r.length}

Export date: ${new Date().toISOString()}
`;t.append(I,{name:"README.txt"}),t.finalize()});return await P({userId:i.user.id,username:i.user.username,action:"TRAINING_DATA_EXPORTED",category:"TRAINING",severity:"INFO",resourceType:"TRAINING_DATA",resourceId:"export",description:`Training data exported: ${r.length} samples from ${Object.keys(a).length} speakers`,metadata:{sampleCount:r.length,speakerCount:Object.keys(a).length}}),new Response(k,{headers:{"Content-Type":"application/zip","Content-Disposition":`attachment; filename="krispoint_training_data_${new Date().toISOString().split("T")[0]}.zip"`,"Content-Length":k.length.toString()}})}catch(r){return console.error("Error exporting training data:",r),new Response(JSON.stringify({success:!1,error:"Failed to export training data"}),{status:500,headers:{"Content-Type":"application/json"}})}};export{B as GET};

import { j as json } from './index-Djsj11qr.js';
import { a as C } from './auth-CFRsUa-j.js';
import { createHmac } from 'node:crypto';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';
import 'bcryptjs';
import 'crypto';

const i=30;function c(){return process.env.VOICE_CLIENT_TOKEN||""}function a(e){return Buffer.from(e).toString("base64url")}function u(e,s){return createHmac("sha256",s).update(e).digest("base64url")}function f(e=Date.now()){const s=c();if(!s)throw new Error("VOICE_CLIENT_TOKEN is not configured");const r=a(JSON.stringify({v:1,exp:Math.floor(e/1e3)+i}));return `${r}.${u(r,s)}`}const I=async({cookies:e})=>{if(process.env.VITE_KRISPOINT_EDITION==="solo")return json({success:false,error:"Voice tickets are unavailable in Solo edition"},{status:404});const s=e.get("session_token");if(!s)return json({success:false,error:"Authentication required"},{status:401});const r=await C(s);if(!r.success)return json({success:false,error:r.error},{status:401});try{return json({ticket:f()})}catch{return json({success:false,error:"Voice service is unavailable"},{status:503})}};

export { I as GET };
//# sourceMappingURL=_server.ts-Ch0gGEjT.js.map

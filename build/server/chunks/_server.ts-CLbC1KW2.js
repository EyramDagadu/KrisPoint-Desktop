import { j as json } from './index-Djsj11qr.js';
import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { v as X } from './auth-CFRsUa-j.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const I=async({request:i})=>{try{const e=await X(i);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const n=e.user.id,[t]=await fe.select().from(_e.userSettings).where(eq(_e.userSettings.userId,n));if(!t)return json({success:!0,settings:{voiceCommandPool:"system",templateScope:"system",macroScope:"system",preferences:{}}});const r=t.preferences||{};return json({success:!0,settings:{...t,templateScope:r.templateScope||t.voiceCommandPool||"system",macroScope:r.macroScope||t.voiceCommandPool||"system"}})}catch(e){return console.error("Error fetching user settings:",e),json({success:false,error:"Failed to fetch user settings"},{status:500})}},b=async({request:i})=>{try{const e=await X(i);if(!e.success||!e.user)return json({success:!1,error:"Unauthorized"},{status:401});const n=e.user.id,t=await i.json(),{voiceCommandPool:r,templateScope:u,macroScope:m,preferences:y}=t,l=["system","personal"];if(r&&!l.includes(r))return json({success:!1,error:'Invalid voice command pool. Must be "system" or "personal"'},{status:400});if(u&&!l.includes(u))return json({success:!1,error:'Invalid template scope. Must be "system" or "personal"'},{status:400});if(m&&!l.includes(m))return json({success:!1,error:'Invalid macro scope. Must be "system" or "personal"'},{status:400});const[d]=await fe.select().from(_e.userSettings).where(eq(_e.userSettings.userId,n)),S={...d?.preferences||{},...y||{},...u?{templateScope:u}:{},...m?{macroScope:m}:{}};if(d){const[o]=await fe.update(_e.userSettings).set({voiceCommandPool:r||d.voiceCommandPool,preferences:S,updatedAt:new Date}).where(eq(_e.userSettings.userId,n)).returning(),a=o.preferences||{};return json({success:!0,settings:{...o,templateScope:a.templateScope||o.voiceCommandPool||"system",macroScope:a.macroScope||o.voiceCommandPool||"system"}})}else {const[o]=await fe.insert(_e.userSettings).values({userId:n,voiceCommandPool:r||"system",preferences:S}).returning(),a=o.preferences||{};return json({success:!0,settings:{...o,templateScope:a.templateScope||"system",macroScope:a.macroScope||"system"}},{status:201})}}catch(e){return console.error("Error updating user settings:",e),json({success:false,error:"Failed to update user settings"},{status:500})}};

export { I as GET, b as PUT };
//# sourceMappingURL=_server.ts-CLbC1KW2.js.map

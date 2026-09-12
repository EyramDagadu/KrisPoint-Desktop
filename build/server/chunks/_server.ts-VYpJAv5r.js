import { j as json } from './index-Djsj11qr.js';
import { d as fe, c as v, u as e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';
import { v as X, l as m } from './auth-CFRsUa-j.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'bcryptjs';
import 'crypto';

const M=async({request:o})=>{try{const e$1=await X(o);if(!e$1.success||!e$1.user)return json({error:"Unauthorized"},{status:401});const t=e$1.user.id,l=await o.json(),{receiverId:a,content:i}=l;if(!a||!i?.trim())return json({error:"Missing receiverId or content"},{status:400});const[m$1]=await fe.insert(v).values({senderId:t,receiverId:parseInt(a),content:i.trim()}).returning(),u=await fe.select({fullName:e.fullName,title:e.title}).from(e).where(eq(e.id,t)).limit(1),c=await fe.select({username:e.username}).from(e).where(eq(e.id,parseInt(a))).limit(1);return await m({userId:t,username:e$1.user.username,userRole:e$1.user.roleName,action:"CHAT_MESSAGE_SENT",category:"COMM",severity:"INFO",resourceType:"CHAT_MESSAGE",resourceId:String(m$1.id),description:`Chat message sent to ${c[0]?.username||"unknown"}`,metadata:{receiverUsername:c[0]?.username}}),json({message:{...m$1,senderName:u[0]?.fullName,senderTitle:u[0]?.title}})}catch(e){return console.error("Error sending message:",e),json({error:"Failed to send message"},{status:500})}};

export { M as POST };
//# sourceMappingURL=_server.ts-VYpJAv5r.js.map

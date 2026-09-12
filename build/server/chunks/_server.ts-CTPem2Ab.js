import { j as json } from './index-Djsj11qr.js';
import { b, R, C, v } from './seed-B1snY_3p.js';
import './db-C6eh-v9M.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';
import 'drizzle-orm';

const f=async({url:r})=>{try{if(r.searchParams.get("force")==="true"){console.log("Force reseed requested...");const s=await R();return s.success?json({success:!0,message:`Force reseed complete! Added ${s.insertedCount} role-permission links.`,insertedCount:s.insertedCount}):json({success:!1,error:"Force reseed failed",details:s.error},{status:500})}if(!await b()){const s=await C();if(!s.success)return json({success:!1,error:"Seeding roles/permissions failed",details:s.error},{status:500})}const c=await v();return c.success?json({success:!0,message:"Database seeded successfully"}):json({success:!1,error:"Seeding templates/macros failed",details:c.error},{status:500})}catch(t){return console.error("Seed API error:",t),json({success:false,error:"Internal server error"},{status:500})}},m=async()=>{try{const r=await b();return json({success:!0,isSeeded:r})}catch(r){return console.error("Seed check error:",r),json({success:false,error:"Failed to check seed status"},{status:500})}};

export { m as GET, f as POST };
//# sourceMappingURL=_server.ts-CTPem2Ab.js.map

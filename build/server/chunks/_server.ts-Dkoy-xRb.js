import { j as json } from './index-Djsj11qr.js';
import { d as fe } from './db-C6eh-v9M.js';
import { sql } from 'drizzle-orm';
import { t } from './validateEnvironment-DTn20BaS.js';
import 'dotenv/config';
import 'pg';
import 'drizzle-orm/node-postgres';
import 'drizzle-orm/pg-core';

const k=async()=>{const t$1=t(),e=process.env.NODE_ENV==="production",s={status:"healthy",timestamp:new Date().toISOString(),version:"1.0.0",checks:{database:{status:"unknown",latencyMs:0},encryption:{status:"unknown"},environment:{status:"unknown",issues:[]}}};try{const n=Date.now();await fe.execute(sql`SELECT 1`),s.checks.database={status:"ok",latencyMs:Date.now()-n};}catch{s.checks.database={status:"error",latencyMs:0},s.status="unhealthy";}t$1.valid?t$1.warnings.length>0?(s.checks.environment={status:"warning",issues:t$1.warnings},e&&(s.status="degraded")):s.checks.environment={status:"ok",issues:[]}:(s.checks.environment={status:"error",issues:t$1.errors},s.status="unhealthy"),process.env.ENCRYPTION_KEY?s.checks.encryption={status:"ok"}:e?(s.checks.encryption={status:"error"},s.status="unhealthy"):s.checks.encryption={status:"warning"};const a=s.status==="healthy"||s.status==="degraded"?200:503;return json(s,{status:a})};

export { k as GET };
//# sourceMappingURL=_server.ts-Dkoy-xRb.js.map

import { d as fe, s as _e } from './db-C6eh-v9M.js';
import { eq } from 'drizzle-orm';

async function p(e){try{const[t]=await fe.select({modality:_e.reports.modality,bodyRegion:_e.reports.bodyRegion,hospitalNumber:_e.patients.mrn}).from(_e.reports).leftJoin(_e.patients,eq(_e.reports.patientId,_e.patients.id)).where(eq(_e.reports.id,e)).limit(1);if(!t)return `R-${e}`;const o=[`R-${e}`];return t.hospitalNumber&&o.push(t.hospitalNumber),t.modality&&o.push(t.modality),t.bodyRegion&&o.push(t.bodyRegion),o.join(" ")}catch(t){return console.error("Error getting report identifier:",t),`R-${e}`}}

export { p };
//# sourceMappingURL=getReportIdentifier-D1d75-b1.js.map

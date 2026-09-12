import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export async function getReportIdentifier(reportId: number): Promise<string> {
  try {
    const [reportData] = await db
      .select({
        modality: schema.reports.modality,
        bodyRegion: schema.reports.bodyRegion,
        hospitalNumber: schema.patients.mrn
      })
      .from(schema.reports)
      .leftJoin(schema.patients, eq(schema.reports.patientId, schema.patients.id))
      .where(eq(schema.reports.id, reportId))
      .limit(1);

    if (!reportData) {
      return `R-${reportId}`;
    }

    const parts: string[] = [`R-${reportId}`];
    
    if (reportData.hospitalNumber) {
      parts.push(reportData.hospitalNumber);
    }
    
    if (reportData.modality) {
      parts.push(reportData.modality);
    }
    
    if (reportData.bodyRegion) {
      parts.push(reportData.bodyRegion);
    }

    return parts.join(' ');
  } catch (error) {
    console.error('Error getting report identifier:', error);
    return `R-${reportId}`;
  }
}

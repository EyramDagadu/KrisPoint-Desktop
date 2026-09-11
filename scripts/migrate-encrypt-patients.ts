import { db, schema } from '../src/lib/server/db';
import { encrypt } from '../src/lib/server/encryption';
import { createHash } from 'crypto';

function hashMrn(mrn: string): string {
  return createHash('sha256').update(mrn.toLowerCase().trim()).digest('hex');
}

function isEncrypted(value: string | null): boolean {
  if (!value) return true;
  return value.includes(':') && value.split(':').length === 3;
}

async function migratePatients() {
  console.log('Starting PHI encryption migration...');
  
  const patients = await db.select().from(schema.patients);
  console.log(`Found ${patients.length} patients to check`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  for (const patient of patients) {
    if (isEncrypted(patient.mrn) && isEncrypted(patient.firstName)) {
      skippedCount++;
      continue;
    }
    
    const updates: any = {};
    
    if (!isEncrypted(patient.firstName)) {
      updates.firstName = encrypt(patient.firstName);
    }
    if (!isEncrypted(patient.lastName)) {
      updates.lastName = encrypt(patient.lastName);
    }
    if (patient.middleName && !isEncrypted(patient.middleName)) {
      updates.middleName = encrypt(patient.middleName);
    }
    if (!isEncrypted(patient.mrn)) {
      updates.mrn = encrypt(patient.mrn);
      updates.hashedMrn = hashMrn(patient.mrn);
    } else if (!patient.hashedMrn) {
      const decryptedMrn = patient.mrn;
      updates.hashedMrn = hashMrn(decryptedMrn);
    }
    if (patient.dateOfBirth && !isEncrypted(patient.dateOfBirth)) {
      updates.dateOfBirth = encrypt(patient.dateOfBirth);
    }
    if (patient.phone && !isEncrypted(patient.phone)) {
      updates.phone = encrypt(patient.phone);
    }
    if (patient.email && !isEncrypted(patient.email)) {
      updates.email = encrypt(patient.email);
    }
    if (patient.address && !isEncrypted(patient.address)) {
      updates.address = encrypt(patient.address);
    }
    
    if (Object.keys(updates).length > 0) {
      const { eq } = await import('drizzle-orm');
      await db.update(schema.patients)
        .set(updates)
        .where(eq(schema.patients.id, patient.id));
      
      migratedCount++;
      console.log(`  Encrypted patient ID ${patient.id}`);
    }
  }
  
  console.log(`\nMigration complete:`);
  console.log(`  Migrated: ${migratedCount}`);
  console.log(`  Already encrypted: ${skippedCount}`);
}

migratePatients()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });

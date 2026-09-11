import { db, schema } from './db';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, encryptPatientData, decryptPatientData } from './encryption';
import { createHash } from 'crypto';

export interface PatientInput {
  firstName: string;
  lastName: string;
  middleName?: string;
  mrn: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdBy?: number;
}

export interface PatientOutput {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  mrn: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function hashMrn(mrn: string): string {
  return createHash('sha256').update(mrn.toLowerCase().trim()).digest('hex');
}

function decryptPatientRow(row: any): PatientOutput {
  return {
    id: row.id,
    firstName: decrypt(row.firstName) || row.firstName,
    lastName: decrypt(row.lastName) || row.lastName,
    middleName: row.middleName ? decrypt(row.middleName) || row.middleName : null,
    mrn: decrypt(row.mrn) || row.mrn,
    dateOfBirth: row.dateOfBirth ? decrypt(row.dateOfBirth) || row.dateOfBirth : null,
    gender: row.gender,
    phone: row.phone ? decrypt(row.phone) || row.phone : null,
    email: row.email ? decrypt(row.email) || row.email : null,
    address: row.address ? decrypt(row.address) || row.address : null,
    isActive: row.isActive ?? true,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export const PatientsRepository = {
  async create(patient: PatientInput): Promise<PatientOutput> {
    const encrypted = encryptPatientData({
      firstName: patient.firstName,
      lastName: patient.lastName,
      middleName: patient.middleName,
      mrn: patient.mrn,
      dateOfBirth: patient.dateOfBirth,
      phone: patient.phone,
      email: patient.email,
      address: patient.address
    });

    const [created] = await db.insert(schema.patients).values({
      firstName: encrypted.firstName!,
      lastName: encrypted.lastName!,
      middleName: encrypted.middleName,
      mrn: encrypted.mrn!,
      hashedMrn: hashMrn(patient.mrn),
      dateOfBirth: encrypted.dateOfBirth,
      gender: patient.gender,
      phone: encrypted.phone,
      email: encrypted.email,
      address: encrypted.address,
      createdBy: patient.createdBy
    }).returning();

    return decryptPatientRow(created);
  },

  async findByMrn(mrn: string): Promise<PatientOutput | null> {
    const hashed = hashMrn(mrn);
    const rows = await db
      .select()
      .from(schema.patients)
      .where(eq(schema.patients.hashedMrn, hashed))
      .limit(1);

    if (rows.length === 0) return null;
    return decryptPatientRow(rows[0]);
  },

  async findById(id: number): Promise<PatientOutput | null> {
    const rows = await db
      .select()
      .from(schema.patients)
      .where(eq(schema.patients.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    return decryptPatientRow(rows[0]);
  },

  async update(id: number, updates: Partial<PatientInput>): Promise<PatientOutput | null> {
    const updateData: any = { updatedAt: new Date() };

    if (updates.firstName !== undefined) updateData.firstName = encrypt(updates.firstName);
    if (updates.lastName !== undefined) updateData.lastName = encrypt(updates.lastName);
    if (updates.middleName !== undefined) updateData.middleName = encrypt(updates.middleName);
    if (updates.dateOfBirth !== undefined) updateData.dateOfBirth = encrypt(updates.dateOfBirth);
    if (updates.phone !== undefined) updateData.phone = encrypt(updates.phone);
    if (updates.email !== undefined) updateData.email = encrypt(updates.email);
    if (updates.address !== undefined) updateData.address = encrypt(updates.address);
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    
    if (updates.mrn !== undefined) {
      updateData.mrn = encrypt(updates.mrn);
      updateData.hashedMrn = hashMrn(updates.mrn);
    }

    const [updated] = await db
      .update(schema.patients)
      .set(updateData)
      .where(eq(schema.patients.id, id))
      .returning();

    if (!updated) return null;
    return decryptPatientRow(updated);
  },

  decryptPatientFields(row: { 
    patientFirstName?: string | null; 
    patientLastName?: string | null; 
    patientHospitalNumber?: string | null;
    patientMrn?: string | null;
    patientDateOfBirth?: string | null;
    [key: string]: any;
  }): typeof row {
    const result = {
      ...row,
      patientFirstName: row.patientFirstName ? decrypt(row.patientFirstName) || row.patientFirstName : null,
      patientLastName: row.patientLastName ? decrypt(row.patientLastName) || row.patientLastName : null
    };
    if ('patientHospitalNumber' in row) {
      (result as any).patientHospitalNumber = row.patientHospitalNumber ? decrypt(row.patientHospitalNumber) || row.patientHospitalNumber : null;
    }
    if ('patientMrn' in row) {
      (result as any).patientMrn = row.patientMrn ? decrypt(row.patientMrn) || row.patientMrn : null;
    }
    if ('patientDateOfBirth' in row) {
      (result as any).patientDateOfBirth = row.patientDateOfBirth ? decrypt(row.patientDateOfBirth) || row.patientDateOfBirth : null;
    }
    return result;
  }
};

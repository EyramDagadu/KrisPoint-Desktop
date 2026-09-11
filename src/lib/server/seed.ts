import { db, schema } from './db';
import { eq, sql } from 'drizzle-orm';

const ROLES = [
  { name: 'owner', displayName: 'System Owner', description: 'Super administrator with exclusive access to training data export and full system control' },
  { name: 'admin', displayName: 'System Administrator', description: 'Full system access with user management capabilities' },
  { name: 'radiologist', displayName: 'Radiologist', description: 'Senior medical professional who can create, finalize, and sign reports' },
  { name: 'resident', displayName: 'Resident', description: 'Medical trainee who can create draft reports for review' },
  { name: 'frontdesk', displayName: 'Front Desk', description: 'Administrative staff who can register patients and manage worklist' }
];

const PERMISSIONS = [
  { name: 'reports.create', displayName: 'Create Reports', description: 'Create new radiology reports', category: 'reports' },
  { name: 'reports.read', displayName: 'Read Reports', description: 'View radiology reports', category: 'reports' },
  { name: 'reports.read_own', displayName: 'Read Own Reports', description: 'View only own reports', category: 'reports' },
  { name: 'reports.update', displayName: 'Update Reports', description: 'Edit existing reports', category: 'reports' },
  { name: 'reports.update_own', displayName: 'Update Own Reports', description: 'Edit only own reports', category: 'reports' },
  { name: 'reports.delete', displayName: 'Delete Reports', description: 'Delete reports', category: 'reports' },
  { name: 'reports.delete_own', displayName: 'Delete Own Reports', description: 'Delete only own reports', category: 'reports' },
  { name: 'reports.finalize', displayName: 'Finalize Reports', description: 'Finalize and sign reports', category: 'reports' },
  { name: 'reports.submit', displayName: 'Submit Reports', description: 'Submit reports for review', category: 'reports' },
  { name: 'reports.review', displayName: 'Review Reports', description: 'Review pending reports from residents', category: 'reports' },
  { name: 'reports.sign_own', displayName: 'Sign Own Reports', description: 'Sign off own reports without specialist review', category: 'reports' },
  { name: 'reports.sign', displayName: 'Sign Reports', description: 'Sign and finalize reports as specialist/reviewer', category: 'reports' },
  { name: 'patients.create', displayName: 'Create Patients', description: 'Register new patients', category: 'patients' },
  { name: 'patients.read', displayName: 'Read Patients', description: 'View patient records', category: 'patients' },
  { name: 'patients.update', displayName: 'Update Patients', description: 'Edit patient information', category: 'patients' },
  { name: 'patients.delete', displayName: 'Delete Patients', description: 'Delete patient records', category: 'patients' },
  { name: 'templates.create', displayName: 'Create Templates', description: 'Create new report templates', category: 'templates' },
  { name: 'templates.read', displayName: 'Read Templates', description: 'View report templates', category: 'templates' },
  { name: 'templates.update', displayName: 'Update Templates', description: 'Edit report templates', category: 'templates' },
  { name: 'templates.delete', displayName: 'Delete Templates', description: 'Delete report templates', category: 'templates' },
  { name: 'templates.manage_system', displayName: 'Manage System Templates', description: 'Create, edit, and delete system-wide templates (admin only)', category: 'templates' },
  { name: 'macros.create', displayName: 'Create Macros', description: 'Create new macros', category: 'macros' },
  { name: 'macros.read', displayName: 'Read Macros', description: 'View macros', category: 'macros' },
  { name: 'macros.update', displayName: 'Update Macros', description: 'Edit macros', category: 'macros' },
  { name: 'macros.delete', displayName: 'Delete Macros', description: 'Delete macros', category: 'macros' },
  { name: 'macros.manage_system', displayName: 'Manage System Macros', description: 'Create, edit, and delete system-wide macros (admin only)', category: 'macros' },
  { name: 'worklist.create', displayName: 'Create Worklist Items', description: 'Add patients to worklist', category: 'worklist' },
  { name: 'worklist.read', displayName: 'Read Worklist', description: 'View worklist items', category: 'worklist' },
  { name: 'worklist.update', displayName: 'Update Worklist', description: 'Edit worklist items', category: 'worklist' },
  { name: 'worklist.delete', displayName: 'Delete Worklist Items', description: 'Remove worklist items', category: 'worklist' },
  { name: 'worklist.pickup', displayName: 'Pick Up Worklist Items', description: 'Pick up worklist items for reporting', category: 'worklist' },
  { name: 'users.create', displayName: 'Create Users', description: 'Create new user accounts', category: 'users' },
  { name: 'users.read', displayName: 'Read Users', description: 'View user accounts', category: 'users' },
  { name: 'users.update', displayName: 'Update Users', description: 'Edit user accounts', category: 'users' },
  { name: 'users.delete', displayName: 'Delete Users', description: 'Delete user accounts', category: 'users' },
  { name: 'users.manage', displayName: 'Manage Users', description: 'Full user management access', category: 'users' },
  { name: 'analytics.view', displayName: 'View Analytics', description: 'View reporting analytics and metrics', category: 'analytics' },
  { name: 'analytics.read', displayName: 'Read Analytics', description: 'Read detailed analytics data', category: 'analytics' },
  { name: 'audit.read', displayName: 'Read Audit Logs', description: 'View system audit logs', category: 'audit' },
  { name: 'system.admin', displayName: 'System Administration', description: 'Full system administration access', category: 'system' },
  { name: 'settings.manage', displayName: 'Manage Settings', description: 'Manage organization and system settings', category: 'settings' },
  { name: 'training.review', displayName: 'Review Training Data', description: 'Review and verify voice training samples', category: 'training' },
  { name: 'training.export', displayName: 'Export Training Data', description: 'Export voice training data for model training (owner only)', category: 'training' }
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    // Reports - all permissions
    'reports.create', 'reports.read', 'reports.read_own', 'reports.update', 'reports.update_own', 
    'reports.delete', 'reports.finalize', 'reports.submit', 'reports.review', 'reports.sign_own', 'reports.sign',
    // Patients - all permissions
    'patients.create', 'patients.read', 'patients.update', 'patients.delete',
    // Templates - all permissions
    'templates.create', 'templates.read', 'templates.update', 'templates.delete', 'templates.manage_system',
    // Macros - all permissions
    'macros.create', 'macros.read', 'macros.update', 'macros.delete', 'macros.manage_system',
    // Worklist - all permissions
    'worklist.create', 'worklist.read', 'worklist.update', 'worklist.delete', 'worklist.pickup',
    // Users - all permissions
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage',
    // Analytics, Audit, System
    'analytics.view', 'analytics.read', 'audit.read', 'system.admin', 'settings.manage',
    // Training - owner exclusive
    'training.review', 'training.export'
  ],
  admin: [
    'reports.create', 'reports.read', 'reports.update', 'reports.update_own', 
    'reports.delete', 'reports.finalize', 'reports.submit', 'reports.review', 'reports.sign_own', 'reports.sign',
    'patients.create', 'patients.read', 'patients.update', 'patients.delete',
    'templates.create', 'templates.read', 'templates.update', 'templates.delete', 'templates.manage_system',
    'macros.create', 'macros.read', 'macros.update', 'macros.delete', 'macros.manage_system',
    'worklist.create', 'worklist.read', 'worklist.update', 'worklist.delete', 'worklist.pickup',
    'users.create', 'users.read', 'users.update', 'users.manage',
    'analytics.view', 'analytics.read', 'audit.read', 'system.admin', 'settings.manage',
    'training.review'
  ],
  radiologist: [
    'reports.create', 'reports.read', 'reports.update', 'reports.finalize', 'reports.review', 'reports.sign',
    'patients.create', 'patients.read', 'patients.update',
    'templates.create', 'templates.read', 'templates.update',
    'macros.create', 'macros.read', 'macros.update',
    'worklist.read', 'worklist.pickup',
    'analytics.view', 'analytics.read'
  ],
  resident: [
    'reports.create', 'reports.read_own', 'reports.update_own', 'reports.delete_own', 'reports.submit', 'reports.sign_own',
    'patients.read',
    'templates.read', 'templates.create', 'templates.update',
    'macros.read', 'macros.create', 'macros.update',
    'worklist.read', 'worklist.pickup',
    'analytics.view', 'analytics.read'
  ],
  frontdesk: [
    'patients.create', 'patients.read', 'patients.update',
    'worklist.create', 'worklist.read', 'worklist.update',
    'reports.read'
  ]
};

export async function seedDatabase() {
  console.log('🌱 Seeding database with roles and permissions...');
  
  try {
    for (const role of ROLES) {
      const existing = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, role.name))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.roles).values(role);
        console.log(`  ✅ Created role: ${role.displayName}`);
      } else {
        console.log(`  ⏭️ Role already exists: ${role.displayName}`);
      }
    }
    
    for (const permission of PERMISSIONS) {
      const existing = await db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.name, permission.name))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.permissions).values(permission);
        console.log(`  ✅ Created permission: ${permission.displayName}`);
      } else {
        console.log(`  ⏭️ Permission already exists: ${permission.displayName}`);
      }
    }
    
    const allRoles = await db.select().from(schema.roles);
    const allPermissions = await db.select().from(schema.permissions);
    
    const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
    const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));
    
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;
      
      for (const permName of permissionNames) {
        const permissionId = permissionMap.get(permName);
        if (!permissionId) continue;
        
        const existing = await db
          .select()
          .from(schema.rolePermissions)
          .where(sql`${schema.rolePermissions.roleId} = ${roleId} AND ${schema.rolePermissions.permissionId} = ${permissionId}`)
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(schema.rolePermissions).values({ roleId, permissionId });
        }
      }
      console.log(`  ✅ Configured permissions for: ${roleName}`);
    }
    
    console.log('✅ Database seeding complete!');
    return { success: true };
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    return { success: false, error };
  }
}

export async function checkDatabaseSeeded(): Promise<boolean> {
  try {
    const roles = await db.select().from(schema.roles);
    const permissions = await db.select().from(schema.permissions);
    const rolePermissions = await db.select().from(schema.rolePermissions);
    // Must have roles, permissions, AND role_permissions linked
    return roles.length >= 5 && permissions.length >= 32 && rolePermissions.length >= 50;
  } catch {
    return false;
  }
}

// Automatically sync permissions and role_permissions on every startup
// This ensures new permissions added to the code are always applied
export async function ensurePermissionsSync() {
  try {
    // First, ensure all permissions exist
    for (const permission of PERMISSIONS) {
      const existing = await db
        .select()
        .from(schema.permissions)
        .where(eq(schema.permissions.name, permission.name))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.permissions).values(permission);
        console.log(`  ✅ Created missing permission: ${permission.displayName}`);
      }
    }
    
    // Now sync all role_permissions
    const allRoles = await db.select().from(schema.roles);
    const allPermissions = await db.select().from(schema.permissions);
    
    if (allRoles.length === 0 || allPermissions.length === 0) {
      // Database not seeded yet, skip sync
      return { success: true, synced: 0 };
    }
    
    const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
    const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));
    
    let syncedCount = 0;
    
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) continue;
      
      for (const permName of permissionNames) {
        const permissionId = permissionMap.get(permName);
        if (!permissionId) continue;
        
        const existing = await db
          .select()
          .from(schema.rolePermissions)
          .where(sql`${schema.rolePermissions.roleId} = ${roleId} AND ${schema.rolePermissions.permissionId} = ${permissionId}`)
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(schema.rolePermissions).values({ roleId, permissionId });
          syncedCount++;
          console.log(`  ✅ Linked permission ${permName} to role ${roleName}`);
        }
      }
    }
    
    if (syncedCount > 0) {
      console.log(`✅ Permission sync complete! Added ${syncedCount} missing role-permission links.`);
    }
    
    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('❌ Permission sync failed:', error);
    return { success: false, error };
  }
}

// Force reseed role permissions even if other data exists
export async function forceReseedRolePermissions() {
  console.log('🔄 Force reseeding role permissions...');
  
  try {
    const allRoles = await db.select().from(schema.roles);
    const allPermissions = await db.select().from(schema.permissions);
    
    const roleMap = new Map(allRoles.map(r => [r.name, r.id]));
    const permissionMap = new Map(allPermissions.map(p => [p.name, p.id]));
    
    let insertedCount = 0;
    
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleName);
      if (!roleId) {
        console.log(`  ⚠️ Role not found: ${roleName}`);
        continue;
      }
      
      for (const permName of permissionNames) {
        const permissionId = permissionMap.get(permName);
        if (!permissionId) {
          console.log(`  ⚠️ Permission not found: ${permName}`);
          continue;
        }
        
        const existing = await db
          .select()
          .from(schema.rolePermissions)
          .where(sql`${schema.rolePermissions.roleId} = ${roleId} AND ${schema.rolePermissions.permissionId} = ${permissionId}`)
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(schema.rolePermissions).values({ roleId, permissionId });
          insertedCount++;
        }
      }
      console.log(`  ✅ Configured permissions for: ${roleName}`);
    }
    
    console.log(`✅ Force reseed complete! Inserted ${insertedCount} role-permission links.`);
    return { success: true, insertedCount };
  } catch (error) {
    console.error('❌ Force reseed failed:', error);
    return { success: false, error };
  }
}

const SYSTEM_TEMPLATES = [
  // CT Templates
  {
    name: 'CT Head (Non-contrast)',
    category: 'CT',
    modality: 'CT',
    bodyRegion: 'Head',
    voiceCommand: 'ct head normal',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Axial CT images of the head were obtained without IV contrast. Images were reconstructed in 5mm slice thickness.</p><p><strong>FINDINGS:</strong></p><p>BRAIN PARENCHYMA: The gray-white matter differentiation is preserved. No acute intraparenchymal hemorrhage, mass effect, or midline shift is identified. The ventricles and sulci are normal in size and configuration for patient\'s age.</p><p>EXTRA-AXIAL SPACES: No acute extra-axial fluid collection. No subarachnoid hemorrhage.</p><p>POSTERIOR FOSSA: The brainstem and cerebellum appear normal. The fourth ventricle is normal in size and position.</p><p>SKULL AND SCALP: No acute fracture or soft tissue abnormality identified.</p><p>PARANASAL SINUSES: The visualized paranasal sinuses are clear.</p><p><strong>IMPRESSION:</strong> No acute intracranial abnormality.</p>',
    isSystem: true
  },
  {
    name: 'CT Chest (With Contrast)',
    category: 'CT',
    modality: 'CT',
    bodyRegion: 'Chest',
    voiceCommand: 'ct chest with contrast',
    content: '<p><strong>COMPARISON:</strong> Comparison is made with prior CT chest dated [DATE].</p><p><strong>TECHNIQUE:</strong> Axial CT images of the chest were obtained following administration of IV contrast. Images were reconstructed in 1.25mm slice thickness with coronal and sagittal reformations.</p><p><strong>FINDINGS:</strong></p><p>LUNGS: The lungs are clear without focal consolidation, pleural effusion, or pneumothorax. No pulmonary nodules or masses are identified.</p><p>MEDIASTINUM: The mediastinal contours are normal. No pathologically enlarged lymph nodes.</p><p>HEART: The heart size is normal. The pericardium appears normal.</p><p>GREAT VESSELS: The aorta and pulmonary arteries are normal in caliber without evidence of dissection or pulmonary embolism.</p><p>PLEURA: No pleural effusion or pneumothorax.</p><p>CHEST WALL: No acute osseous abnormality identified.</p><p><strong>IMPRESSION:</strong> Normal CT chest examination.</p>',
    isSystem: true
  },
  {
    name: 'CT Abdomen/Pelvis (With Contrast)',
    category: 'CT',
    modality: 'CT',
    bodyRegion: 'Abdomen/Pelvis',
    voiceCommand: 'ct abdomen normal',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Axial CT images of the abdomen and pelvis were obtained following administration of oral and IV contrast. Images were reconstructed in 2.5mm slice thickness.</p><p><strong>FINDINGS:</strong></p><p>LIVER: The liver is normal in size and attenuation. No focal lesions identified.</p><p>GALLBLADDER: The gallbladder is normal without gallstones or wall thickening.</p><p>PANCREAS: The pancreas appears normal without focal lesions or ductal dilatation.</p><p>SPLEEN: The spleen is normal in size and attenuation.</p><p>KIDNEYS: Both kidneys are normal in size, shape, and attenuation. No hydronephrosis or stones identified.</p><p>ADRENALS: Normal appearing adrenal glands.</p><p>BOWEL: No bowel obstruction or inflammatory changes identified.</p><p>PELVIS: The bladder and pelvic organs appear normal.</p><p>LYMPH NODES: No pathologically enlarged lymph nodes.</p><p>BONES: No acute osseous abnormality identified.</p><p><strong>IMPRESSION:</strong> Normal CT abdomen and pelvis examination.</p>',
    isSystem: true
  },
  // MRI Templates
  {
    name: 'MRI Brain (With and Without Contrast)',
    category: 'MRI',
    modality: 'MRI',
    bodyRegion: 'Brain',
    voiceCommand: 'mri brain normal',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> MRI of the brain was performed using standard sequences including T1, T2, FLAIR, and DWI both before and after gadolinium administration.</p><p><strong>FINDINGS:</strong></p><p>BRAIN PARENCHYMA: Normal gray and white matter signal intensity. No acute infarction on diffusion-weighted imaging. No abnormal enhancement following gadolinium administration.</p><p>VENTRICLES: The lateral, third, and fourth ventricles are normal in size and configuration.</p><p>EXTRA-AXIAL SPACES: No extra-axial fluid collections or abnormal enhancement.</p><p>POSTERIOR FOSSA: The brainstem and cerebellum demonstrate normal signal intensity and morphology.</p><p>VASCULAR STRUCTURES: Normal flow voids in the major intracranial vessels.</p><p>SKULL BASE: No abnormality identified.</p><p><strong>IMPRESSION:</strong> Normal MRI brain examination.</p>',
    isSystem: true
  },
  {
    name: 'MRI Lumbar Spine',
    category: 'MRI',
    modality: 'MRI',
    bodyRegion: 'Lumbar Spine',
    voiceCommand: 'mri lumbar spine',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> MRI of the lumbar spine was performed using standard sequences including T1 and T2-weighted images in sagittal and axial planes.</p><p><strong>FINDINGS:</strong></p><p>ALIGNMENT: Normal lumbar lordosis is maintained. No spondylolisthesis.</p><p>VERTEBRAL BODIES: Normal vertebral body heights and signal intensity. No compression fractures.</p><p>INTERVERTEBRAL DISCS:</p><p>L1-L2: Normal disc height and signal.</p><p>L2-L3: Normal disc height and signal.</p><p>L3-L4: Normal disc height and signal.</p><p>L4-L5: Normal disc height and signal.</p><p>L5-S1: Normal disc height and signal.</p><p>SPINAL CANAL: No spinal canal stenosis. The conus medullaris terminates at the L1 level.</p><p>NEURAL FORAMINA: No significant neural foraminal narrowing.</p><p>PARASPINAL SOFT TISSUES: No abnormality identified.</p><p><strong>IMPRESSION:</strong> Normal MRI lumbar spine examination.</p>',
    isSystem: true
  },
  // X-ray Templates
  {
    name: 'Chest X-ray (PA and Lateral)',
    category: 'X-ray',
    modality: 'X-ray',
    bodyRegion: 'Chest',
    voiceCommand: 'chest x-ray normal',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Frontal and lateral chest radiographs were obtained.</p><p><strong>FINDINGS:</strong></p><p>LUNGS: The lungs are clear without focal consolidation, pleural effusion, or pneumothorax. Normal pulmonary vascularity.</p><p>HEART: Heart size is normal. Normal cardiac silhouette.</p><p>MEDIASTINUM: Normal mediastinal contours. No hilar enlargement.</p><p>PLEURA: No pleural effusion or pneumothorax.</p><p>OSSEOUS STRUCTURES: No acute osseous abnormality identified.</p><p>SOFT TISSUES: Normal soft tissue structures.</p><p><strong>IMPRESSION:</strong> Normal chest radiograph.</p>',
    isSystem: true
  },
  {
    name: 'Abdominal X-ray (Supine)',
    category: 'X-ray',
    modality: 'X-ray',
    bodyRegion: 'Abdomen',
    voiceCommand: 'abdominal x-ray',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Supine abdominal radiograph was obtained.</p><p><strong>FINDINGS:</strong></p><p>BOWEL GAS PATTERN: Normal bowel gas pattern without evidence of obstruction or ileus.</p><p>SOFT TISSUES: Normal soft tissue structures.</p><p>OSSEOUS STRUCTURES: No acute osseous abnormality identified.</p><p>OTHER: No abnormal calcifications or radiopaque foreign bodies identified.</p><p><strong>IMPRESSION:</strong> Normal abdominal radiograph.</p>',
    isSystem: true
  },
  // Ultrasound Templates
  {
    name: 'Abdominal Ultrasound (Complete)',
    category: 'Ultrasound',
    modality: 'Ultrasound',
    bodyRegion: 'Abdomen',
    voiceCommand: 'ultrasound abdomen',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Real-time ultrasound examination of the abdomen was performed using standard transabdominal approach.</p><p><strong>FINDINGS:</strong></p><p>LIVER: The liver demonstrates normal size, echogenicity, and contour. No focal lesions identified. Portal vein is patent with hepatopetal flow.</p><p>GALLBLADDER: The gallbladder is normal in size and wall thickness. No gallstones or sludge identified. No pericholecystic fluid.</p><p>BILE DUCTS: No intrahepatic or extrahepatic biliary ductal dilatation.</p><p>PANCREAS: The visualized portions of the pancreas appear normal.</p><p>SPLEEN: The spleen is normal in size and echogenicity.</p><p>KIDNEYS: Both kidneys are normal in size and echogenicity. No hydronephrosis or masses identified.</p><p>AORTA: The aorta is normal in caliber.</p><p>INFERIOR VENA CAVA: Normal caliber and respiratory variation.</p><p><strong>IMPRESSION:</strong> Normal abdominal ultrasound examination.</p>',
    isSystem: true
  },
  {
    name: 'Pelvic Ultrasound (Transvaginal)',
    category: 'Ultrasound',
    modality: 'Ultrasound',
    bodyRegion: 'Pelvis',
    voiceCommand: 'pelvic ultrasound',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Transvaginal ultrasound examination was performed using standard technique.</p><p><strong>FINDINGS:</strong></p><p>UTERUS: The uterus is normal in size and echogenicity. The endometrium measures [X] mm in thickness, which is appropriate for patient\'s cycle/postmenopausal status.</p><p>OVARIES:</p><p>Right ovary: Normal size and echogenicity. No dominant follicles or masses.</p><p>Left ovary: Normal size and echogenicity. No dominant follicles or masses.</p><p>ADNEXA: No adnexal masses or free fluid identified.</p><p>POUCH OF DOUGLAS: No free fluid identified.</p><p><strong>IMPRESSION:</strong> Normal pelvic ultrasound examination.</p>',
    isSystem: true
  },
  // Trauma Templates
  {
    name: 'CT Head (Trauma Protocol)',
    category: 'CT',
    modality: 'CT',
    bodyRegion: 'Head',
    voiceCommand: 'ct head trauma',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Non-contrast CT head was performed for trauma evaluation.</p><p><strong>FINDINGS:</strong></p><p>BRAIN PARENCHYMA: No acute intraparenchymal hemorrhage, mass effect, or midline shift. Gray-white matter differentiation is preserved.</p><p>EXTRA-AXIAL SPACES: No acute subdural, epidural, or subarachnoid hemorrhage.</p><p>VENTRICLES: Normal size and configuration of the ventricular system.</p><p>SKULL: No acute fracture identified.</p><p>SOFT TISSUES: No significant scalp hematoma or soft tissue swelling.</p><p><strong>IMPRESSION:</strong> No acute traumatic intracranial injury.</p>',
    isSystem: true
  },
  {
    name: 'CT Cervical Spine (Trauma)',
    category: 'CT',
    modality: 'CT',
    bodyRegion: 'Cervical Spine',
    voiceCommand: 'ct cervical spine',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> CT of the cervical spine was performed without contrast for trauma evaluation with sagittal and coronal reformations.</p><p><strong>FINDINGS:</strong></p><p>ALIGNMENT: Normal cervical lordosis. No subluxation or dislocation.</p><p>VERTEBRAL BODIES: Normal height and density of all cervical vertebral bodies. No compression or burst fractures.</p><p>POSTERIOR ELEMENTS: Intact posterior elements including spinous processes, laminae, and facet joints.</p><p>SPINAL CANAL: No spinal canal compromise.</p><p>SOFT TISSUES: No significant prevertebral soft tissue swelling.</p><p>ATLANTOOCCIPITAL AND ATLANTOAXIAL JOINTS: Normal relationships.</p><p><strong>IMPRESSION:</strong> No acute cervical spine fracture or malalignment.</p>',
    isSystem: true
  },
  // Fluoroscopy Templates
  {
    name: 'Upper GI Series (Barium)',
    category: 'Fluoroscopy',
    modality: 'Fluoroscopy',
    bodyRegion: 'Upper GI',
    voiceCommand: 'upper gi series',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Upper GI examination was performed using oral barium contrast with fluoroscopic guidance and spot images.</p><p><strong>FINDINGS:</strong></p><p>ESOPHAGUS: The esophagus demonstrates normal caliber and peristalsis. No evidence of stricture, mass, or ulceration. The gastroesophageal junction is normal.</p><p>STOMACH: The stomach fills and empties normally. Normal rugal folds. No evidence of mass, ulcer, or outlet obstruction.</p><p>DUODENUM: Normal duodenal bulb and sweep. No evidence of ulceration or mass.</p><p>SMALL BOWEL: Normal transit of contrast through the proximal small bowel.</p><p><strong>IMPRESSION:</strong> Normal upper gastrointestinal examination.</p>',
    isSystem: true
  },
  {
    name: 'Barium Swallow (Esophagram)',
    category: 'Fluoroscopy',
    modality: 'Fluoroscopy',
    bodyRegion: 'Esophagus',
    voiceCommand: 'barium swallow',
    content: '<p><strong>COMPARISON:</strong> No prior studies available for comparison.</p><p><strong>TECHNIQUE:</strong> Barium swallow examination was performed with thin and thick barium contrast under fluoroscopic guidance.</p><p><strong>FINDINGS:</strong></p><p>SWALLOWING MECHANISM: Normal pharyngeal phase of swallowing without aspiration.</p><p>ESOPHAGUS: The esophagus demonstrates normal caliber throughout. Normal primary peristalsis with effective bolus transport. No evidence of stricture, mass, diverticulum, or varices.</p><p>GASTROESOPHAGEAL JUNCTION: Normal configuration and competence. No evidence of hiatal hernia or gastroesophageal reflux.</p><p>STOMACH: The proximal stomach fills normally.</p><p><strong>IMPRESSION:</strong> Normal barium swallow examination.</p>',
    isSystem: true
  }
];

const SYSTEM_MACROS = [
  // Chest Category
  { name: 'Normal Lungs', voiceCommand: 'normal lungs', content: 'The lungs are clear bilaterally without focal consolidation, pneumothorax, or pleural effusion.', category: 'Chest', isSystem: true },
  { name: 'Normal Heart', voiceCommand: 'normal heart', content: 'The heart size is within normal limits. No pericardial effusion.', category: 'Chest', isSystem: true },
  { name: 'Normal Chest CT', voiceCommand: 'normal chest ct', content: 'The lungs are clear bilaterally without focal consolidation, nodule, or mass. No pleural effusion or pneumothorax. The heart is normal in size and configuration. The great vessels appear normal. No significant lymphadenopathy is identified.', category: 'Chest', isSystem: true },
  { name: 'Pulmonary Nodule', voiceCommand: 'pulmonary nodule', content: 'There is a [SIZE] nodule identified in the [location] of the [lobe] lobe. The nodule appears [solid/subsolid/ground-glass]. No other significant pulmonary nodules are identified.', category: 'Chest', isSystem: true },
  // Neuro Category
  { name: 'Normal Brain', voiceCommand: 'normal brain', content: 'No acute intracranial abnormality. Brain parenchyma appears normal with preserved grey-white matter differentiation.', category: 'Neuro', isSystem: true },
  { name: 'Normal Brain MRI', voiceCommand: 'normal brain mri', content: 'The brain parenchyma demonstrates normal signal intensity on all sequences. The ventricular system is normal in size and configuration. No mass effect, midline shift, or abnormal enhancement. The visualized orbits and paranasal sinuses are unremarkable.', category: 'Neuro', isSystem: true },
  { name: 'Chronic Small Vessel Disease', voiceCommand: 'small vessel disease', content: 'There are scattered punctate T2/FLAIR hyperintense foci in the periventricular and subcortical white matter, consistent with chronic small vessel ischemic changes. No acute infarct or hemorrhage is identified.', category: 'Neuro', isSystem: true },
  // Abdomen Category
  { name: 'Normal Liver', voiceCommand: 'normal liver', content: 'The liver is normal in size and echotexture without focal lesions.', category: 'Abdomen', isSystem: true },
  { name: 'Normal Kidneys', voiceCommand: 'normal kidneys', content: 'Both kidneys are normal in size and appearance with no hydronephrosis or nephrolithiasis.', category: 'Abdomen', isSystem: true },
  { name: 'Normal Abdomen CT', voiceCommand: 'normal abdomen ct', content: 'The liver, spleen, pancreas, and kidneys appear normal. No focal lesions are identified. The gallbladder is unremarkable. No free fluid or lymphadenopathy. The bowel appears normal without obstruction.', category: 'Abdomen', isSystem: true },
  { name: 'Normal Gallbladder', voiceCommand: 'normal gallbladder', content: 'The gallbladder is normal in size and wall thickness. No gallstones or sludge identified. No pericholecystic fluid.', category: 'Abdomen', isSystem: true },
  { name: 'Normal Spleen', voiceCommand: 'normal spleen', content: 'The spleen is normal in size and echogenicity.', category: 'Abdomen', isSystem: true },
  { name: 'Normal Pancreas', voiceCommand: 'normal pancreas', content: 'The visualized portions of the pancreas appear normal without focal lesions or ductal dilatation.', category: 'Abdomen', isSystem: true },
  // MSK Category
  { name: 'No Fracture', voiceCommand: 'no fracture', content: 'No acute fracture or dislocation identified.', category: 'MSK', isSystem: true },
  { name: 'Normal Bones', voiceCommand: 'normal bones', content: 'No acute osseous abnormality identified. Normal bone density and alignment.', category: 'MSK', isSystem: true },
  { name: 'Degenerative Changes', voiceCommand: 'degenerative changes', content: 'Mild degenerative changes are identified with no acute abnormality.', category: 'MSK', isSystem: true },
  // General/Impressions Category
  { name: 'Clinical Correlation', voiceCommand: 'clinical correlation', content: 'Clinical correlation is recommended.', category: 'General', isSystem: true },
  { name: 'Recommend Follow-up', voiceCommand: 'recommend follow up', content: 'Recommend clinical correlation and follow-up as clinically indicated.', category: 'General', isSystem: true },
  { name: 'Unremarkable', voiceCommand: 'unremarkable', content: 'The examination is unremarkable.', category: 'General', isSystem: true },
  { name: 'Comparison Study', voiceCommand: 'comparison', content: 'Compared to prior study dated ', category: 'General', isSystem: true },
  { name: 'No Acute Findings', voiceCommand: 'no acute findings', content: 'No acute abnormality identified.', category: 'General', isSystem: true },
  { name: 'Stable Appearance', voiceCommand: 'stable appearance', content: 'Stable appearance compared to prior study dated [prior date]. No significant interval change.', category: 'General', isSystem: true },
  { name: 'Further Imaging', voiceCommand: 'further imaging', content: 'Further imaging with [modality] may be considered for additional characterization if clinically indicated.', category: 'General', isSystem: true }
];

export async function seedSystemTemplatesAndMacros() {
  console.log('🌱 Seeding system templates and macros...');
  
  try {
    // Find an owner or admin user to use as the creator for system items
    const ownerRole = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.name, 'owner'))
      .limit(1);
    
    let systemUserId: number | null = null;
    
    if (ownerRole.length > 0) {
      const ownerUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.roleId, ownerRole[0].id))
        .limit(1);
      
      if (ownerUser.length > 0) {
        systemUserId = ownerUser[0].id;
      }
    }
    
    // If no owner found, try to find any admin user
    if (!systemUserId) {
      const adminRole = await db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, 'admin'))
        .limit(1);
      
      if (adminRole.length > 0) {
        const adminUser = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.roleId, adminRole[0].id))
          .limit(1);
        
        if (adminUser.length > 0) {
          systemUserId = adminUser[0].id;
        }
      }
    }
    
    // If still no user found, get the first user in the system
    if (!systemUserId) {
      const anyUser = await db
        .select()
        .from(schema.users)
        .limit(1);
      
      if (anyUser.length > 0) {
        systemUserId = anyUser[0].id;
      }
    }
    
    if (!systemUserId) {
      console.log('⚠️ No users found in the system. Please create a user first before seeding templates and macros.');
      return { success: false, error: 'No users found. Create a user account first.' };
    }
    
    console.log(`  Using user ID ${systemUserId} as creator for system templates and macros`);
    
    for (const template of SYSTEM_TEMPLATES) {
      const existing = await db
        .select()
        .from(schema.templates)
        .where(sql`${schema.templates.name} = ${template.name} AND ${schema.templates.isSystem} = true`)
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.templates).values({
          ...template,
          createdBy: systemUserId
        });
        console.log(`  ✅ Created system template: ${template.name}`);
      } else {
        console.log(`  ⏭️ System template already exists: ${template.name}`);
      }
    }
    
    for (const macro of SYSTEM_MACROS) {
      const existing = await db
        .select()
        .from(schema.macros)
        .where(sql`${schema.macros.name} = ${macro.name} AND ${schema.macros.isSystem} = true`)
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(schema.macros).values({
          ...macro,
          createdBy: systemUserId
        });
        console.log(`  ✅ Created system macro: ${macro.name}`);
      } else {
        console.log(`  ⏭️ System macro already exists: ${macro.name}`);
      }
    }
    
    console.log('✅ System templates and macros seeding complete!');
    return { success: true };
  } catch (error) {
    console.error('❌ System templates/macros seeding failed:', error);
    return { success: false, error };
  }
}

export async function validateSystemTemplatesAndMacros(): Promise<{ templatesCount: number; macrosCount: number; valid: boolean }> {
  try {
    const templates = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.isSystem, true));
    
    const macros = await db
      .select()
      .from(schema.macros)
      .where(eq(schema.macros.isSystem, true));
    
    const templatesCount = templates.length;
    const macrosCount = macros.length;
    const valid = templatesCount > 0 && macrosCount > 0;
    
    if (!valid) {
      console.warn('⚠️ System templates or macros missing! Voice commands may not work. Run database seed to initialize.');
    }
    
    return { templatesCount, macrosCount, valid };
  } catch (error) {
    console.error('Failed to validate system templates/macros:', error);
    return { templatesCount: 0, macrosCount: 0, valid: false };
  }
}

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { seedDatabase, checkDatabaseSeeded, seedSystemTemplatesAndMacros, forceReseedRolePermissions } from '$lib/server/seed';

export const POST: RequestHandler = async ({ url }) => {
  try {
    const force = url.searchParams.get('force') === 'true';
    
    if (force) {
      // Force reseed role permissions even if database appears seeded
      console.log('Force reseed requested...');
      const result = await forceReseedRolePermissions();
      if (result.success) {
        return json({ 
          success: true, 
          message: `Force reseed complete! Added ${result.insertedCount} role-permission links.`,
          insertedCount: result.insertedCount
        });
      } else {
        return json({ 
          success: false, 
          error: 'Force reseed failed',
          details: result.error
        }, { status: 500 });
      }
    }
    
    const isSeeded = await checkDatabaseSeeded();
    
    if (!isSeeded) {
      const result = await seedDatabase();
      if (!result.success) {
        return json({ 
          success: false, 
          error: 'Seeding roles/permissions failed',
          details: result.error
        }, { status: 500 });
      }
    }
    
    const templatesResult = await seedSystemTemplatesAndMacros();
    
    if (templatesResult.success) {
      return json({ 
        success: true, 
        message: 'Database seeded successfully' 
      });
    } else {
      return json({ 
        success: false, 
        error: 'Seeding templates/macros failed',
        details: templatesResult.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Seed API error:', error);
    return json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  try {
    const isSeeded = await checkDatabaseSeeded();
    return json({ 
      success: true, 
      isSeeded 
    });
  } catch (error) {
    console.error('Seed check error:', error);
    return json({ 
      success: false, 
      error: 'Failed to check seed status' 
    }, { status: 500 });
  }
};

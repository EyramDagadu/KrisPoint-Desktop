import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest, checkPermission, logAudit } from '$lib/server/auth';
import { eq, and, ne } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const macroId = parseInt(params.id);
    if (isNaN(macroId)) {
      return json({ success: false, error: 'Invalid macro ID' }, { status: 400 });
    }

    const [macro] = await db
      .select()
      .from(schema.macros)
      .where(eq(schema.macros.id, macroId));

    if (!macro) {
      return json({ success: false, error: 'Macro not found' }, { status: 404 });
    }

    const userId = session.user.id;
    if (!macro.isSystem && macro.createdBy !== userId) {
      return json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return json({ success: true, macro });
  } catch (error) {
    console.error('Error fetching macro:', error);
    return json({ success: false, error: 'Failed to fetch macro' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const macroId = parseInt(params.id);
    if (isNaN(macroId)) {
      return json({ success: false, error: 'Invalid macro ID' }, { status: 400 });
    }

    const [existingMacro] = await db
      .select()
      .from(schema.macros)
      .where(eq(schema.macros.id, macroId));

    if (!existingMacro) {
      return json({ success: false, error: 'Macro not found' }, { status: 404 });
    }

    const userId = session.user.id;

    if (existingMacro.isSystem) {
      const hasPermission = await checkPermission(userId, 'macros.manage_system');
      if (!hasPermission) {
        return json({ success: false, error: 'Only admins can edit system macros' }, { status: 403 });
      }
    } else if (existingMacro.createdBy !== userId) {
      return json({ success: false, error: 'You can only edit your own macros' }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, content, variables, voiceCommand } = body;

    if (voiceCommand && voiceCommand.trim()) {
      const normalizedVoiceCommand = voiceCommand.trim().toLowerCase();
      
      let conflictQuery;
      if (existingMacro.isSystem) {
        conflictQuery = await db
          .select()
          .from(schema.macros)
          .where(and(
            eq(schema.macros.isSystem, true),
            eq(schema.macros.isActive, true),
            ne(schema.macros.id, macroId)
          ));
      } else {
        conflictQuery = await db
          .select()
          .from(schema.macros)
          .where(and(
            eq(schema.macros.isSystem, false),
            eq(schema.macros.createdBy, userId),
            eq(schema.macros.isActive, true),
            ne(schema.macros.id, macroId)
          ));
      }

      const existingConflict = conflictQuery.find(
        m => m.voiceCommand?.toLowerCase() === normalizedVoiceCommand
      );

      if (existingConflict) {
        const poolName = existingMacro.isSystem ? 'system' : 'personal';
        return json({ 
          success: false, 
          error: `Voice command "${voiceCommand}" already exists in ${poolName} macros` 
        }, { status: 400 });
      }
    }

    const [updatedMacro] = await db
      .update(schema.macros)
      .set({
        name: name || existingMacro.name,
        category: category !== undefined ? category : existingMacro.category,
        content: content || existingMacro.content,
        variables: variables !== undefined ? variables : existingMacro.variables,
        voiceCommand: voiceCommand !== undefined ? (voiceCommand?.trim() || null) : existingMacro.voiceCommand,
        updatedAt: new Date()
      })
      .where(eq(schema.macros.id, macroId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'MACRO_UPDATED',
      category: 'MACROS',
      severity: 'INFO',
      resourceType: 'MACRO',
      resourceId: String(macroId),
      description: `${existingMacro.isSystem ? 'System' : 'Personal'} macro "${updatedMacro.name}" updated`
    });

    return json({ success: true, macro: updatedMacro });
  } catch (error) {
    console.error('Error updating macro:', error);
    return json({ success: false, error: 'Failed to update macro' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const macroId = parseInt(params.id);
    if (isNaN(macroId)) {
      return json({ success: false, error: 'Invalid macro ID' }, { status: 400 });
    }

    const [existingMacro] = await db
      .select()
      .from(schema.macros)
      .where(eq(schema.macros.id, macroId));

    if (!existingMacro) {
      return json({ success: false, error: 'Macro not found' }, { status: 404 });
    }

    const userId = session.user.id;

    if (existingMacro.isSystem) {
      const hasPermission = await checkPermission(userId, 'macros.manage_system');
      if (!hasPermission) {
        return json({ success: false, error: 'Only admins can delete system macros' }, { status: 403 });
      }
    } else if (existingMacro.createdBy !== userId) {
      return json({ success: false, error: 'You can only delete your own macros' }, { status: 403 });
    }

    await db
      .update(schema.macros)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.macros.id, macroId));

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'MACRO_DELETED',
      category: 'MACROS',
      severity: 'INFO',
      resourceType: 'MACRO',
      resourceId: String(macroId),
      description: `${existingMacro.isSystem ? 'System' : 'Personal'} macro "${existingMacro.name}" deleted`
    });

    return json({ success: true, message: 'Macro deleted' });
  } catch (error) {
    console.error('Error deleting macro:', error);
    return json({ success: false, error: 'Failed to delete macro' }, { status: 500 });
  }
};

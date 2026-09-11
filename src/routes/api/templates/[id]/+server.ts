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

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return json({ success: false, error: 'Invalid template ID' }, { status: 400 });
    }

    const [template] = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.id, templateId));

    if (!template) {
      return json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const userId = session.user.id;
    if (!template.isSystem && template.createdBy !== userId) {
      return json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return json({ success: true, template });
  } catch (error) {
    console.error('Error fetching template:', error);
    return json({ success: false, error: 'Failed to fetch template' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return json({ success: false, error: 'Invalid template ID' }, { status: 400 });
    }

    const [existingTemplate] = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.id, templateId));

    if (!existingTemplate) {
      return json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const userId = session.user.id;

    if (existingTemplate.isSystem) {
      const hasPermission = await checkPermission(userId, 'templates.manage_system');
      if (!hasPermission) {
        return json({ success: false, error: 'Only admins can edit system templates' }, { status: 403 });
      }
    } else if (existingTemplate.createdBy !== userId) {
      return json({ success: false, error: 'You can only edit your own templates' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      name, category, modality, bodyRegion, 
      comparisonHtml, techniqueHtml, findingsHtml, impressionHtml,
      content, variables, voiceCommand 
    } = body;

    // Build content from sections if sections are provided
    let finalContent = content;
    if (comparisonHtml !== undefined || techniqueHtml !== undefined || 
        findingsHtml !== undefined || impressionHtml !== undefined) {
      const sections = [];
      const comp = comparisonHtml ?? existingTemplate.comparisonHtml;
      const tech = techniqueHtml ?? existingTemplate.techniqueHtml;
      const find = findingsHtml ?? existingTemplate.findingsHtml;
      const impr = impressionHtml ?? existingTemplate.impressionHtml;
      
      if (comp) sections.push(`<p><strong>COMPARISON:</strong></p>${comp}`);
      if (tech) sections.push(`<p><strong>TECHNIQUE:</strong></p>${tech}`);
      if (find) sections.push(`<p><strong>FINDINGS:</strong></p>${find}`);
      if (impr) sections.push(`<p><strong>IMPRESSION:</strong></p>${impr}`);
      finalContent = sections.join('\n');
    }

    if (voiceCommand && voiceCommand.trim()) {
      const normalizedVoiceCommand = voiceCommand.trim().toLowerCase();
      
      let conflictQuery;
      if (existingTemplate.isSystem) {
        conflictQuery = await db
          .select()
          .from(schema.templates)
          .where(and(
            eq(schema.templates.isSystem, true),
            eq(schema.templates.isActive, true),
            ne(schema.templates.id, templateId)
          ));
      } else {
        conflictQuery = await db
          .select()
          .from(schema.templates)
          .where(and(
            eq(schema.templates.isSystem, false),
            eq(schema.templates.createdBy, userId),
            eq(schema.templates.isActive, true),
            ne(schema.templates.id, templateId)
          ));
      }

      const existingConflict = conflictQuery.find(
        t => t.voiceCommand?.toLowerCase() === normalizedVoiceCommand
      );

      if (existingConflict) {
        const poolName = existingTemplate.isSystem ? 'system' : 'personal';
        return json({ 
          success: false, 
          error: `Voice command "${voiceCommand}" already exists in ${poolName} templates` 
        }, { status: 400 });
      }
    }

    const [updatedTemplate] = await db
      .update(schema.templates)
      .set({
        name: name || existingTemplate.name,
        category: category !== undefined ? category : existingTemplate.category,
        modality: modality !== undefined ? modality : existingTemplate.modality,
        bodyRegion: bodyRegion !== undefined ? bodyRegion : existingTemplate.bodyRegion,
        comparisonHtml: comparisonHtml !== undefined ? comparisonHtml : existingTemplate.comparisonHtml,
        techniqueHtml: techniqueHtml !== undefined ? techniqueHtml : existingTemplate.techniqueHtml,
        findingsHtml: findingsHtml !== undefined ? findingsHtml : existingTemplate.findingsHtml,
        impressionHtml: impressionHtml !== undefined ? impressionHtml : existingTemplate.impressionHtml,
        content: finalContent || existingTemplate.content,
        variables: variables !== undefined ? variables : existingTemplate.variables,
        voiceCommand: voiceCommand !== undefined ? (voiceCommand?.trim() || null) : existingTemplate.voiceCommand,
        updatedAt: new Date()
      })
      .where(eq(schema.templates.id, templateId))
      .returning();

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'TEMPLATE_UPDATED',
      category: 'TEMPLATES',
      severity: 'INFO',
      resourceType: 'TEMPLATE',
      resourceId: String(templateId),
      description: `${existingTemplate.isSystem ? 'System' : 'Personal'} template "${updatedTemplate.name}" updated`
    });

    return json({ success: true, template: updatedTemplate });
  } catch (error) {
    console.error('Error updating template:', error);
    return json({ success: false, error: 'Failed to update template' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ request, params }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return json({ success: false, error: 'Invalid template ID' }, { status: 400 });
    }

    const [existingTemplate] = await db
      .select()
      .from(schema.templates)
      .where(eq(schema.templates.id, templateId));

    if (!existingTemplate) {
      return json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const userId = session.user.id;

    if (existingTemplate.isSystem) {
      const hasPermission = await checkPermission(userId, 'templates.manage_system');
      if (!hasPermission) {
        return json({ success: false, error: 'Only admins can delete system templates' }, { status: 403 });
      }
    } else if (existingTemplate.createdBy !== userId) {
      return json({ success: false, error: 'You can only delete your own templates' }, { status: 403 });
    }

    await db
      .update(schema.templates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.templates.id, templateId));

    await logAudit({
      userId: session.user.id,
      username: session.user.username,
      userRole: session.user.roleName,
      action: 'TEMPLATE_DELETED',
      category: 'TEMPLATES',
      severity: 'INFO',
      resourceType: 'TEMPLATE',
      resourceId: String(templateId),
      description: `${existingTemplate.isSystem ? 'System' : 'Personal'} template "${existingTemplate.name}" deleted`
    });

    return json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
};

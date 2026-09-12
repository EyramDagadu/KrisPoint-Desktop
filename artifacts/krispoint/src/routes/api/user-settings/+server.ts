import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, schema } from '$lib/server/db';
import { validateSessionFromRequest } from '$lib/server/auth';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [settings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId));

    if (!settings) {
      return json({ 
        success: true, 
        settings: { 
          voiceCommandPool: 'system',
          templateScope: 'system',
          macroScope: 'system',
          preferences: {}
        } 
      });
    }

    // Extract templateScope and macroScope from preferences if stored there
    const prefs = settings.preferences || {};
    return json({ 
      success: true, 
      settings: {
        ...settings,
        templateScope: prefs.templateScope || settings.voiceCommandPool || 'system',
        macroScope: prefs.macroScope || settings.voiceCommandPool || 'system'
      }
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return json({ success: false, error: 'Failed to fetch user settings' }, { status: 500 });
  }
};

export const PUT: RequestHandler = async ({ request }) => {
  try {
    const session = await validateSessionFromRequest(request);
    if (!session.success || !session.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { voiceCommandPool, templateScope, macroScope, preferences } = body;

    // Validate scope values
    const validScopes = ['system', 'personal'];
    if (voiceCommandPool && !validScopes.includes(voiceCommandPool)) {
      return json({ success: false, error: 'Invalid voice command pool. Must be "system" or "personal"' }, { status: 400 });
    }
    if (templateScope && !validScopes.includes(templateScope)) {
      return json({ success: false, error: 'Invalid template scope. Must be "system" or "personal"' }, { status: 400 });
    }
    if (macroScope && !validScopes.includes(macroScope)) {
      return json({ success: false, error: 'Invalid macro scope. Must be "system" or "personal"' }, { status: 400 });
    }

    const [existingSettings] = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, userId));

    // Merge templateScope and macroScope into preferences
    const existingPrefs = existingSettings?.preferences || {};
    const updatedPrefs = {
      ...existingPrefs,
      ...(preferences || {}),
      ...(templateScope ? { templateScope } : {}),
      ...(macroScope ? { macroScope } : {})
    };

    if (existingSettings) {
      const [updatedSettings] = await db
        .update(schema.userSettings)
        .set({
          voiceCommandPool: voiceCommandPool || existingSettings.voiceCommandPool,
          preferences: updatedPrefs,
          updatedAt: new Date()
        })
        .where(eq(schema.userSettings.userId, userId))
        .returning();

      // Return with extracted scopes for convenience
      const prefs = updatedSettings.preferences || {};
      return json({ 
        success: true, 
        settings: {
          ...updatedSettings,
          templateScope: prefs.templateScope || updatedSettings.voiceCommandPool || 'system',
          macroScope: prefs.macroScope || updatedSettings.voiceCommandPool || 'system'
        }
      });
    } else {
      const [newSettings] = await db
        .insert(schema.userSettings)
        .values({
          userId,
          voiceCommandPool: voiceCommandPool || 'system',
          preferences: updatedPrefs
        })
        .returning();

      const prefs = newSettings.preferences || {};
      return json({ 
        success: true, 
        settings: {
          ...newSettings,
          templateScope: prefs.templateScope || 'system',
          macroScope: prefs.macroScope || 'system'
        }
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    return json({ success: false, error: 'Failed to update user settings' }, { status: 500 });
  }
};

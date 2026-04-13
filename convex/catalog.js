import { mutation, query } from "./_generated/server";
import { v } from 'convex/values';
import { roleCanAccessModule } from './lib/authz';
import { DIRECTORATES, FORMATIONS, MODULE_DEFINITIONS, RANK_OPTIONS, ROLE_OPTIONS, UNITS } from './platform';

async function seedByCode(ctx, tableName, indexName, values) {
  for (const value of values) {
    const existing = await ctx.db.query(tableName).withIndex(indexName, (q) => q.eq('code', value.code)).unique();
    if (!existing) {
      await ctx.db.insert(tableName, value);
    }
  }
}

export const bootstrapReferenceData = mutation({
  args: {},
  handler: async (ctx) => {
    await seedByCode(
      ctx,
      'rankCatalog',
      'by_code',
      RANK_OPTIONS.map((rank, index) => ({
        code: rank.toLowerCase().replace(/\s+/g, '_'),
        label: rank,
        order: index + 1,
      })),
    );
    await seedByCode(ctx, 'directorateCatalog', 'by_code', DIRECTORATES);
    await seedByCode(ctx, 'formationCatalog', 'by_code', FORMATIONS);
    await seedByCode(ctx, 'unitCatalog', 'by_code', UNITS);

    for (const moduleDefinition of MODULE_DEFINITIONS) {
      const existingTemplate = await ctx.db
        .query('inspectionTemplates')
        .withIndex('by_module_code', (q) => q.eq('moduleCode', moduleDefinition.moduleCode))
        .unique();

      if (existingTemplate) continue;

      const templateId = await ctx.db.insert('inspectionTemplates', {
        moduleCode: moduleDefinition.moduleCode,
        title: moduleDefinition.title,
        classification: moduleDefinition.classification,
        description: moduleDefinition.description,
        active: true,
        createdAt: Date.now(),
      });

      for (const [sectionIndex, section] of moduleDefinition.sections.entries()) {
        const sectionId = await ctx.db.insert('inspectionSections', {
          templateId,
          title: section.title,
          order: sectionIndex + 1,
          weight: section.items.reduce((total, item) => total + item.weight, 0),
        });

        for (const [itemIndex, item] of section.items.entries()) {
          await ctx.db.insert('inspectionItems', {
            templateId,
            sectionId,
            code: item.code,
            prompt: item.prompt,
            responseType: item.responseType,
            weight: item.weight,
            order: itemIndex + 1,
          });
        }
      }
    }

    return { ok: true };
  },
});

export const registrationFormOptions = query({
  args: {},
  handler: async (ctx) => {
    const ranks = await ctx.db.query('rankCatalog').collect();
    const directorates = await ctx.db.query('directorateCatalog').collect();
    const formations = await ctx.db.query('formationCatalog').collect();
    const units = await ctx.db.query('unitCatalog').collect();

    return {
      ranks: ranks.sort((left, right) => left.order - right.order),
      directorates,
      formations,
      units,
      roles: ROLE_OPTIONS.map((role) => ({
        code: role.code,
        label: role.label,
        privileged: role.privileged,
      })),
    };
  },
});

export const listModules = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db.query('authSessions').withIndex('by_session_token', (q) => q.eq('sessionToken', args.sessionToken)).unique();
    if (!session || session.status !== 'active' || session.expiresAt < Date.now()) {
      throw new Error('Authentication required.');
    }
    const user = await ctx.db.get(session.userId);
    if (!user || user.status !== 'active') {
      throw new Error('Active user session not found.');
    }

    const templates = await ctx.db.query('inspectionTemplates').collect();
    return templates
      .filter((template) => roleCanAccessModule(user.activeRoleCode, template.moduleCode))
      .map((template) => ({
        id: template._id,
        moduleCode: template.moduleCode,
        title: template.title,
        classification: template.classification,
        description: template.description,
      }));
  },
});

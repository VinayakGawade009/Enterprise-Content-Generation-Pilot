import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyWorkspace = query({
  args: {},
  handler: async (ctx) => {
    // Assuming a single workspace per environment for now.
    // In a real multi-tenant app, we'd filter by user identity.
    const rules = await ctx.db.query("workspace_rules").first();
    return rules;
  },
});

export const createOrUpdateWorkspace = mutation({
  args: {
    market_identity: v.object({
      workspace_id: v.string(),
      business_model: v.string(),
      approved_regions: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          locales: v.array(v.string()),
        })
      ),
      approved_personas: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
        })
      ),
    }),
    brand_guidelines: v.object({
      colors: v.object({
        primary_hex: v.string(),
        secondary_hex: v.string(),
      }),
      typography: v.object({
        primary_font: v.string(),
        secondary_font: v.string(),
      }),
      assets: v.object({
        logo_urls: v.array(v.string()),
      }),
    }),
    compliance_rules: v.object({
      forbidden_phrases: v.array(v.string()),
      mandatory_disclaimers_by_region: v.record(v.string(), v.string()),
      mandatory_disclaimers_by_topic: v.record(v.string(), v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("workspace_rules").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      const id = await ctx.db.insert("workspace_rules", args);
      return id;
    }
  },
});

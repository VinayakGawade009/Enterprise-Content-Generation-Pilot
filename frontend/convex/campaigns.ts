import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize a new campaign in the database.
 */
export const create = mutation({
  args: {
    campaign_brief: v.object({
      campaign_id: v.string(),
      initiated_by: v.string(),
      creative_objective: v.string(),
      target_regions: v.array(v.string()),
      target_personas: v.array(v.string()),
      desired_formats: v.array(v.string()),
      enable_localization: v.boolean(),
      selected_language: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("campaigns", {
      campaign_brief: args.campaign_brief,
      status: "PROCESSING",
    });
    return id;
  },
});

/**
 * Fetch a campaign by its ID for real-time tracking.
 */
export const getById = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Fetch recent campaigns for the main dashboard.
 */
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("campaigns")
      .order("desc")
      .take(args.limit ?? 10);
  },
});

/**
 * Update the status and results of a campaign (called by backend or HITL approval).
 */
export const updateStatus = mutation({
  args: {
    id: v.id("campaigns"),
    status: v.string(),
    master_text: v.optional(
      v.object({
        text: v.string(),
        character_count: v.number(),
      })
    ),
    text_audit: v.optional(
      v.object({
        status: v.string(),
        violations: v.array(v.any()),
      })
    ),
    localized_texts: v.optional(v.any()),
    regional_audit: v.optional(v.any()),
    visual_assets: v.optional(v.array(v.any())),
    visual_audit: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    await ctx.db.patch(id, updateFields);
  },
});

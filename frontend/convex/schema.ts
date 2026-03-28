import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workspace_rules: defineTable({
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
  }),

  campaigns: defineTable({
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
    status: v.string(), // e.g., "DRAFTING", "PENDING_GATE_1", "PENDING_GATE_2", "PENDING_GATE_3", "PUBLISHED"
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
    localized_texts: v.optional(
      v.object({
        translations: v.record(
          v.string(),
          v.object({
            text: v.string(),
          })
        ),
        character_counts: v.record(v.string(), v.number()),
      })
    ),
    regional_audit: v.optional(v.any()),
    visual_assets: v.optional(v.array(v.object({
      id: v.string(),
      locale: v.string(),
      format: v.string(),
      url: v.string(),
      status: v.string(),
    }))),
    visual_audit: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
});

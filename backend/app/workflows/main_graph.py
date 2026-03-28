from typing import List, Dict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from .state import GraphState
from app.agents.knowledge_to_content import generate_master_draft
from app.agents.textual_governance import audit_text
from app.agents.localization import transcreate_text
from app.agents.visual_governance import audit_image_assets
from app.services.convex_sync import update_convex_campaign

# ───────────────────────────────────────────────────────────────
# NODES
# ───────────────────────────────────────────────────────────────

async def node_draft_content(state: GraphState):
    """
    Node 1: Knowledge to Content
    Incorporate Qdrant retrieval and human feedback if present.
    """
    # Simulate Qdrant retrieval from the creative objective
    facts = [
        {"source": "SharePoint/ProductSpecs", "fact": "AutoHeal Agent supports Node.js and Python projects."}
    ]
    
    # If feedback exists, prepend it to the prompt
    prompt_modifier = f"User Feedback to incorporate: {state.get('feedback', '')}\n" if state.get("feedback") else ""
    
    draft = await generate_master_draft(state["brief"], facts, state["compliance_rules"])
    
    await update_convex_campaign(state["db_id"], {"master_text": {"text": draft, "character_count": len(draft)}})
    
    return {"draft_text": draft, "current_status": "PROCESSING", "feedback": ""}

async def node_text_governance(state: GraphState):
    """
    Node 2: Textual Governance Audit
    Uses spaCy to check for forbidden phrases.
    """
    audit = audit_text(state["draft_text"], state["compliance_rules"].forbidden_phrases)
    
    await update_convex_campaign(state["db_id"], {
        "text_audit": {"status": audit.status, "violations": audit.violations},
        "status": "GATE_1_TEXT"
    })
    
    return {"text_audit": audit, "current_status": "GATE_1_TEXT"}

async def node_localize_content(state: GraphState):
    """
    Node 3: Localization Engine (Conditional)
    Branching logic for Indian languages or tone adaptation.
    """
    localized = {}
    master_text = state.get("locked_master_text") or state.get("draft_text", "")
    
    if state.get("enable_localization") and state.get("selected_language"):
        # Real translation to specific Indian language
        text = await transcreate_text(master_text, state["selected_language"])
        localized[state["selected_language"]] = text
    else:
        # Default: Adapt tone for target regions (simulated here)
        for region in state["brief"].target_regions:
            localized[region] = f"[Adapted for {region}]: {master_text[:50]}..."
            
    return {"localized_texts": localized, "current_status": "PROCESSING"}

async def node_regional_governance(state: GraphState):
    """
    Node 4: Regional Governance (LQA Audit)
    """
    # Simple placeholder audit for regional content
    regional_audit = {locale: "PASSED" for locale in state["localized_texts"].keys()}
    
    await update_convex_campaign(state["db_id"], {
      "localized_texts": {
        "translations": {l: {"text": t} for l, t in state["localized_texts"].items()},
        "character_counts": {l: len(t) for l, t in state["localized_texts"].items()}
      },
      "regional_audit": regional_audit,
      "status": "GATE_2_LOCALIZATION"
    })
    
    return {"regional_audit": regional_audit, "current_status": "GATE_2_LOCALIZATION"}

async def node_visual_generation(state: GraphState):
    """
    Node 5: Visual Asset Generation
    Strictly filters based on desired_formats from campaign_brief.
    """
    formats = state["brief"].desired_formats
    assets = []
    
    # We produce one asset set per locale
    locales = state["localized_texts"].keys()
    
    for locale in locales:
        for fmt in formats:
            # Check format type
            is_image = "Image" in fmt
            asset_url = "https://images.unsplash.com/photo-1618401303847-c186851d6540" if is_image else "https://example.com/mock-video.mp4"
            
            assets.append({
                "id": f"v-{locale}-{fmt.replace(' ', '-')}",
                "locale": locale,
                "format": fmt,
                "url": asset_url,
                "status": "COMPLETED"
            })
            
    return {"visual_assets": assets, "current_status": "PROCESSING"}

async def node_visual_governance(state: GraphState):
    """
    Node 6: Visual Governance Audit (Hex variance, overflow)
    """
    # Simulate Pillow hex variance check
    status = "PASSED"
    
    await update_convex_campaign(state["db_id"], {
        "visual_assets": state["visual_assets"],
        "status": "GATE_4_VISUALS" # Mapping State 4 to Gate 4 UI visuals
    })
    
    return {"current_status": "GATE_4_VISUALS"}

# ───────────────────────────────────────────────────────────────
# ROUTING & CONSTRUCTION
# ───────────────────────────────────────────────────────────────

def route_after_text_audit(state: GraphState):
    # If the audit fails, the orchestrator should automatically retry node_draft_content
    if state["text_audit"].status == "FAILED":
        return "node_draft_content"
    return "node_localize_content"

def route_after_visual_audit(state: GraphState):
    # Placeholder for loop back logic if audit fails
    return END

builder = StateGraph(GraphState)

builder.add_node("node_draft_content", node_draft_content)
builder.add_node("node_text_governance", node_text_governance)
builder.add_node("node_localize_content", node_localize_content)
builder.add_node("node_regional_governance", node_regional_governance)
builder.add_node("node_visual_generation", node_visual_generation)
builder.add_node("node_visual_governance", node_visual_governance)

builder.add_edge(START, "node_draft_content")
builder.add_edge("node_draft_content", "node_text_governance")
builder.add_conditional_edges("node_text_governance", route_after_text_audit)

builder.add_edge("node_localize_content", "node_regional_governance")
builder.add_edge("node_regional_governance", "node_visual_generation")
builder.add_edge("node_visual_generation", "node_visual_governance")
builder.add_edge("node_visual_governance", END)

memory = MemorySaver()
app = builder.compile(
    checkpointer=memory,
    # Pause points for HITL review
    interrupt_before=[
        "node_localize_content",  # Pause for Gate 1 review
        "node_visual_generation", # Pause for Gate 2 review
        # End is implicit pause on state 4
    ]
)

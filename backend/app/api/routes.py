from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.campaign import CampaignBrief
from app.models.admin_rules import ComplianceRules
from app.workflows.main_graph import app as graph_app
from app.workflows.state import GraphState

router = APIRouter()

class InitiateRequest(BaseModel):
    db_id: str
    campaign_id: str
    initiated_by: str
    creative_objective: str
    target_regions: List[str]
    target_personas: List[str]
    desired_formats: List[str]
    enable_localization: bool
    selected_language: Optional[str] = None

class GateRequest(BaseModel):
    db_id: str
    feedback: Optional[str] = None
    gate_number: Optional[int] = None

@router.post("/api/campaign/initiate")
async def initiate_campaign(req: InitiateRequest):
    try:
        # Mock compliance rules for simple testing
        compliance_rules = ComplianceRules(
            forbidden_phrases=["medical grade"],
            mandatory_disclaimers_by_region={},
            mandatory_disclaimers_by_topic={}
        )
        
        brief = CampaignBrief(
            campaign_id=req.campaign_id,
            initiated_by=req.initiated_by,
            creative_objective=req.creative_objective,
            target_regions=req.target_regions,
            target_personas=req.target_personas,
            desired_formats=req.desired_formats
        )
        
        initial_state: GraphState = {
            "campaign_id": req.campaign_id,
            "db_id": req.db_id,
            "brief": brief,
            "compliance_rules": compliance_rules,
            "draft_text": "",
            "text_audit": None,
            "locked_master_text": "",
            "enable_localization": req.enable_localization,
            "selected_language": req.selected_language or "English",
            "localized_texts": {},
            "regional_audit": {},
            "visual_assets": [],
            "visual_audit": None,
            "feedback": "",
            "current_status": "PROCESSING"
        }
        
        config = {"configurable": {"thread_id": req.db_id}}
        
        # Invoke the graph
        await graph_app.ainvoke(initial_state, config)
        
        state_info = await graph_app.aget_state(config)
        next_nodes = state_info.next
        
        return {
            "db_id": req.db_id,
            "status": f"WAITING_AT_{next_nodes[0].upper()}" if next_nodes else "COMPLETED"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def handle_gate_resume(db_id: str, feedback: Optional[str], gate_number: Optional[int]):
    config = {"configurable": {"thread_id": db_id}}
    state_info = await graph_app.aget_state(config)
    
    if not state_info.next:
        raise HTTPException(status_code=400, detail="Campaign not in a waiting state")

    if feedback:
        # If feedback is provided, we update the state and technically we might want 
        # to go BACK to the previous node. For this flow:
        # Gate 1 -> node_draft_content
        # Gate 2 -> node_localize_content
        target_node = "node_draft_content" if gate_number == 1 else "node_localize_content"
        
        await graph_app.aupdate_state(config, {"feedback": feedback}, as_node=target_node)
        # We need to manually set the next node pointer if we want to loop back
        # In a real LangGraph setup, we'd use a more robust "rewind" or conditional logic
        # For now, we'll assume the node logic handles the next step or we resume
    
    await graph_app.ainvoke(None, config)
    
    new_state = await graph_app.aget_state(config)
    next_nodes = new_state.next
    
    return {
        "db_id": db_id,
        "status": f"WAITING_AT_{next_nodes[0].upper()}" if next_nodes else "COMPLETED"
    }

@router.post("/api/campaign/approve-gate-1")
async def approve_gate_1(req: GateRequest):
    return await handle_gate_resume(req.db_id, None, 1)

@router.post("/api/campaign/approve-gate-2")
async def approve_gate_2(req: GateRequest):
    return await handle_gate_resume(req.db_id, None, 2)

@router.post("/api/campaign/reject-gate")
async def reject_gate(req: GateRequest):
    """Handles 'Regenerate with feedback'"""
    if not req.feedback:
        raise HTTPException(status_code=400, detail="Feedback is required for regeneration")
    return await handle_gate_resume(req.db_id, req.feedback, req.gate_number)

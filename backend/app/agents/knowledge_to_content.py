import os
import logging
from openai import AsyncOpenAI
from langsmith import traceable

logger = logging.getLogger(__name__)

@traceable(name="generate_master_draft")
async def generate_master_draft(brief, facts, compliance_rules) -> str:
    """
    Generate master draft with dynamic persona and region context.
    """
    try:
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Personas and Regions
        persona = ", ".join(brief.target_personas) if brief.target_personas else "General Audience"
        regions = ", ".join(brief.target_regions) if brief.target_regions else "Global"
        
        system_prompt = (
            f"You are an expert copywriter targeting {persona} in {regions}. "
            "Write vibrant, engaging, and highly persuasive content. "
            f"You MUST absolutely AVOID using: {', '.join(compliance_rules.forbidden_phrases)}. "
            "Align strictly with the creative objective."
        )
        
        facts_text = "\n".join([f"- {getattr(f, 'source', 'Context')}: {getattr(f, 'fact', f)}" for f in facts])
        user_prompt = (
            f"Creative Objective: {brief.creative_objective}\n\n"
            f"Semantic Context:\n{facts_text}\n\n"
            "Generate the master draft copy."
        )
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating master draft: {e}")
        return f"Error: {str(e)}"

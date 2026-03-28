import os
import logging
from openai import AsyncOpenAI
from langsmith import traceable

logger = logging.getLogger(__name__)

@traceable(name="transcreate_text")
async def transcreate_text(master_text: str, target_locale: str) -> str:
    """
    Transcreate the master text into the target locale.
    """
    try:
        client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        system_prompt = (
            f"You are an expert localization specialist and transcreator. "
            f"Your task is to culturally adapt (transcreate) the following text into the {target_locale} locale. "
            "Ensure the translation sounds natural to native speakers while maintaining the vibrant tone of the original text."
        )
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": master_text}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error during transcreation: {e}")
        return f"Error: {str(e)}"

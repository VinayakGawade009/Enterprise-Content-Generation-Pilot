from app.models.governance import TextualGovernanceAudit, Violation

def audit_text(draft_text: str, forbidden_phrases: list[str]) -> TextualGovernanceAudit:
    """
    Scan the draft_text to detect any forbidden phrases.
    """
    lower_text = draft_text.lower()
    
    violations = []
    
    for phrase in forbidden_phrases:
        phrase_lower = phrase.lower()
        start_idx = lower_text.find(phrase_lower)
        while start_idx != -1:
            violations.append(
                Violation(
                    type="forbidden_phrase",
                    phrase=phrase,
                    index=start_idx
                )
            )
            # Find next occurrence
            start_idx = lower_text.find(phrase_lower, start_idx + len(phrase_lower))
            
    if violations:
        return TextualGovernanceAudit(
            agent="textual_governance_spacy",
            status="FAILED",
            violations=violations,
            action="ROUTE_TO_REVISION"
        )
        
    return TextualGovernanceAudit(
        agent="textual_governance_spacy",
        status="PASSED",
        violations=[],
        action="APPROVE"
    )

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class GuardrailResult(BaseModel):
    passed: bool
    reason: Optional[str] = None


FORBIDDEN_TERMS = ["approved", "suspicious", "clearance", "high risk"]
RISK_CONTEXT_TERMS = ["low", "medium", "high", "prohibited"]


def check_guardrails(fields: List[Dict[str, Any]]) -> GuardrailResult:
    """
    Hard stop when any of these holds:
    1. The output contains a risk_rating field.
    2. The text contains "Low", "Medium", "High", or "Prohibited" in a risk context.
    3. The text contains "approved", "suspicious", "clearance", or "high risk".
    Returns pass or fail with the reason. A failure blocks the draft.
    """
    for field in fields:
        field_name = str(field.get("name", "")).strip().lower()
        field_value = str(field.get("value", "")).strip()
        quoted_span = str(field.get("quoted_span", "")).strip()

        # 1. Output contains a risk_rating field
        if field_name == "risk_rating" or "risk_rating" in field:
            return GuardrailResult(
                passed=False,
                reason="Guardrail triggered: Output contains forbidden field 'risk_rating'. Risk rating must be assigned exclusively by the MLRO."
            )

        # Check all text in candidate
        combined_text = f"{field_name} {field_value} {quoted_span}"
        combined_lower = combined_text.lower()

        # 3. Contains forbidden clearance/judgment terms
        for term in FORBIDDEN_TERMS:
            # Word boundary check or substring
            pattern = rf"\b{re.escape(term)}\b"
            if re.search(pattern, combined_lower):
                return GuardrailResult(
                    passed=False,
                    reason=f"Guardrail triggered: Text contains unauthorized automated judgment term '{term}'."
                )

        # 2. Contains "Low", "Medium", "High", or "Prohibited" in a risk context
        # e.g., "risk is low", "low risk tier", "medium risk", "risk: prohibited", "prohibited risk"
        risk_context_patterns = [
            r"\brisk\b\s*(?:level|tier|rating|category|score|status|assessment)?\s*(?:is|:|=|-)?\s*\b(low|medium|high|prohibited)\b",
            r"\b(low|medium|high|prohibited)\s*(?:-|–)?\s*risk\b",
            r"\bclassified\s+as\s+(low|medium|high|prohibited)\b",
            r"\brisk\s*:\s*(low|medium|high|prohibited)\b"
        ]
        for r_pat in risk_context_patterns:
            m = re.search(r_pat, combined_lower)
            if m:
                matched_val = m.group(1) if m.groups() else "risk tier"
                return GuardrailResult(
                    passed=False,
                    reason=f"Guardrail triggered: AI output attempted risk classification '{matched_val}' in risk context. MLRO discretion required."
                )

    return GuardrailResult(passed=True, reason=None)

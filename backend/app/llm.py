import os
import time
import json
import hashlib
from typing import Protocol, List, Dict, Any, Tuple, Optional
try:
    from app.schemas import CandidateField
except ImportError:
    from backend.app.schemas import CandidateField


class LLMAdapter(Protocol):
    def scan_citations(
        self, lines_data: List[Tuple[int, int, str]], case_context: Optional[str] = None
    ) -> Tuple[List[CandidateField], Dict[str, Any]]:
        ...


class MockLLMAdapter:
    """
    Deterministic mock adapter used when GEMINI_API_KEY is not set or when call fails.
    Replays high-accuracy KYC candidate extractions from the provided lines.
    """
    def scan_citations(
        self, lines_data: List[Tuple[int, int, str]], case_context: Optional[str] = None
    ) -> Tuple[List[CandidateField], Dict[str, Any]]:
        start_time = time.time()
        lines_text = "\n".join(f"Page {p}, Line {l}: {t}" for p, l, t in lines_data)
        prompt_hash = hashlib.sha256(lines_text.encode("utf-8")).hexdigest()

        candidates: List[CandidateField] = []
        lower_context = (case_context or "").lower() + " " + lines_text.lower()

        # Check for Apex Logistics
        if "apex logistics" in lower_context:
            candidates = [
                CandidateField(
                    name="Legal Entity Name",
                    value="Apex Logistics Ltd",
                    quoted_span="Apex Logistics Ltd",
                    page=1,
                    line=4,
                    confidence=0.98,
                ),
                CandidateField(
                    name="Beneficial Owner & Holding",
                    value="John Sterling (75.00% Ordinary Voting Shares)",
                    quoted_span="JOHN STERLING",
                    page=2,
                    line=13,
                    confidence=0.97,
                ),
                CandidateField(
                    name="Director / Controller Identity",
                    value="John Sterling (Sole Managing Director)",
                    quoted_span="JOHN STERLING",
                    page=2,
                    line=13,
                    confidence=0.96,
                ),
            ]
        # Check for Meridian Green LLP
        elif "meridian green" in lower_context:
            candidates = [
                CandidateField(
                    name="Legal Entity Name",
                    value="Meridian Green LLP",
                    quoted_span="Meridian Green LLP",
                    page=1,
                    line=5,
                    confidence=0.95,
                ),
                CandidateField(
                    name="Designated Members",
                    value="Elena Vance (50%), Marcus Thorne (50%)",
                    quoted_span="Elena Vance",
                    page=3,
                    line=12,
                    confidence=0.94,
                ),
                CandidateField(
                    name="Managing Partner / Controller",
                    value="Elena Vance",
                    quoted_span="Elena Vance",
                    page=6,
                    line=18,
                    confidence=0.92,
                ),
            ]
        # Check for Veloce FinTech AG
        elif "veloce" in lower_context:
            candidates = [
                CandidateField(
                    name="Legal Entity Name",
                    value="Veloce FinTech AG",
                    quoted_span="Veloce FinTech AG",
                    page=1,
                    line=3,
                    confidence=0.99,
                ),
                CandidateField(
                    name="Parent Entity",
                    value="Lindqvist Holding SE (70.0% Ordinary Shares)",
                    quoted_span="Lindqvist Holding SE",
                    page=12,
                    line=20,
                    confidence=0.95,
                ),
                CandidateField(
                    name="Ultimate Beneficial Owner",
                    value="Henrik Lindqvist (100.0% of Lindqvist Holding SE -> 70.0% effective holding)",
                    quoted_span="Henrik Lindqvist",
                    page=8,
                    line=14,
                    confidence=0.96,
                ),
            ]
        # Check for Nautilus Offshore
        elif "nautilus" in lower_context:
            candidates = [
                CandidateField(
                    name="Legal Entity Name",
                    value="Nautilus Offshore BVI",
                    quoted_span="Nautilus Offshore BVI",
                    page=1,
                    line=3,
                    confidence=0.95,
                ),
                CandidateField(
                    name="Nominee Director",
                    value="Michael Sterling",
                    quoted_span="Michael Sterling",
                    page=14,
                    line=9,
                    confidence=0.54,  # Nominee trap at 54%
                ),
                CandidateField(
                    name="Custody & Bearer Provision",
                    value="50,000 Bearer Share Certificates",
                    quoted_span="50,000 Bearer Share Certificates",
                    page=22,
                    line=18,
                    confidence=0.62,
                ),
            ]
        else:
            # Generic fallback from available lines
            for p, l, text in lines_data[:5]:
                if len(text.strip()) > 5:
                    candidates.append(
                        CandidateField(
                            name="Document Field",
                            value=text.strip(),
                            quoted_span=text.strip()[:20],
                            page=p,
                            line=l,
                            confidence=0.88,
                        )
                    )

        latency_ms = int((time.time() - start_time) * 1000)
        metadata = {
            "model_name": "mock-adapter",
            "prompt_hash": prompt_hash,
            "latency_ms": max(latency_ms, 5),
            "is_mock": True,
        }
        return candidates, metadata


class GeminiLLMAdapter:
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model
        self.mock_fallback = MockLLMAdapter()

    def scan_citations(
        self, lines_data: List[Tuple[int, int, str]], case_context: Optional[str] = None
    ) -> Tuple[List[CandidateField], Dict[str, Any]]:
        from google import genai

        start_time = time.time()
        lines_formatted = "\n".join(f"Page {p}, Line {l}: {t}" for p, l, t in lines_data[:300])
        prompt = (
            "You are a strict compliance document parser for Northgate Corporate Bank. "
            "Analyze the document text below which contains numbered pages and lines. "
            "Extract candidate legal, beneficial ownership, controller, and corporate structure fields. "
            "For every candidate field, you MUST provide: "
            "- name: field name (e.g. Legal Entity Name, Beneficial Owner & Holding, Director / Controller Identity, Nominee Director) "
            "- value: the extracted value "
            "- quoted_span: exact verbatim excerpt from that specific page and line "
            "- page: integer page number where quoted_span appears verbatim "
            "- line: integer line number where quoted_span appears verbatim "
            "- confidence: float score between 0.0 and 1.0 "
            "\nDO NOT invent or summarize quoted_span. It must match the source line verbatim. "
            "DO NOT include risk_rating, approved, clearance, suspicious, or high risk terms in your output. "
            "Return JSON only with a top-level key 'fields' containing the list of candidate objects.\n\n"
            f"Context: {case_context or 'General'}\n"
            f"Document Content:\n{lines_formatted}"
        )
        prompt_hash = hashlib.sha256(prompt.encode("utf-8")).hexdigest()

        try:
            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            raw_text = response.text or "{}"
            parsed = json.loads(raw_text)
            field_list = parsed.get("fields", [])
            candidates: List[CandidateField] = []
            for item in field_list:
                candidates.append(
                    CandidateField(
                        name=item.get("name", "Unknown Field"),
                        value=str(item.get("value", "")),
                        quoted_span=str(item.get("quoted_span", "")),
                        page=int(item.get("page", 1)),
                        line=int(item.get("line", 1)),
                        confidence=float(item.get("confidence", 0.5)),
                    )
                )

            latency_ms = int((time.time() - start_time) * 1000)
            metadata = {
                "model_name": self.model,
                "prompt_hash": prompt_hash,
                "latency_ms": latency_ms,
                "is_mock": False,
            }
            return candidates, metadata
        except Exception as e:
            # Fall back to mock adapter upon failure
            cand, meta = self.mock_fallback.scan_citations(lines_data, case_context)
            meta["fallback_reason"] = str(e)
            meta["is_mock"] = True
            return cand, meta


def get_llm_adapter() -> LLMAdapter:
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    model = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash").strip()
    if not api_key:
        return MockLLMAdapter()
    return GeminiLLMAdapter(api_key=api_key, model=model)

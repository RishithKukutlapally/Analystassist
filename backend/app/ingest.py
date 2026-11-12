import re
from typing import List, Tuple, Dict, Optional


def parse_text_to_pages_and_lines(raw_text: str) -> List[Tuple[int, int, str]]:
    """
    Splits text into pages and numbered lines.
    Pages can be delimited by form-feed \f or markers like '--- PAGE X ---' or '=== Page X ==='.
    If no page markers exist, each chunk or the entire doc is Page 1.
    Returns list of (page_number, line_number, text).
    """
    page_marker_pattern = re.compile(r"(?:^|\n)\s*(?:---|===)\s*(?:PAGE|Page)\s*(\d+)\s*(?:---|===)\s*(?:\n|$)")
    markers = list(page_marker_pattern.finditer(raw_text))

    pages: List[Tuple[int, str]] = []
    if "\f" in raw_text:
        raw_pages = raw_text.split("\f")
        for idx, page_content in enumerate(raw_pages, start=1):
            pages.append((idx, page_content))
    elif markers:
        last_pos = 0
        current_page_num = 1
        for match in markers:
            segment = raw_text[last_pos:match.start()].strip()
            if segment:
                pages.append((current_page_num, segment))
            current_page_num = int(match.group(1))
            last_pos = match.end()
        remainder = raw_text[last_pos:].strip()
        if remainder:
            pages.append((current_page_num, remainder))
    else:
        pages.append((1, raw_text))

    result: List[Tuple[int, int, str]] = []
    for page_num, page_content in pages:
        lines = page_content.splitlines()
        for line_num, line_str in enumerate(lines, start=1):
            clean_line = line_str.rstrip()
            result.append((page_num, line_num, clean_line))

    return result


def parse_citation_ref(ref_str: str) -> Optional[Tuple[int, int]]:
    """
    Parses a citation string into (page, line).
    Handles formats like:
      - "Page 1, Line 4"
      - "[Page 2, Line 16]"
      - "Page 2, Lines 13-16" -> line 13
      - "[p.14:L9]" or "p.14:L9" -> page 14, line 9
    """
    # Pattern 1: Page P, Line(s) L
    m1 = re.search(r"page\s*(\d+).*?line[s]?\s*(\d+)", ref_str, re.IGNORECASE)
    if m1:
        return int(m1.group(1)), int(m1.group(2))

    # Pattern 2: p.P:L or p.P:LL
    m2 = re.search(r"p\.?\s*(\d+)\s*[:,\s]\s*L?(\d+)", ref_str, re.IGNORECASE)
    if m2:
        return int(m2.group(1)), int(m2.group(2))

    return None


def resolve_citation(lines_map: Dict[Tuple[int, int], str], page: int, line: int) -> Optional[str]:
    """
    Looks up stored text at Page P, Line L.
    """
    return lines_map.get((page, line))

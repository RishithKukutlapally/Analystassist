from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class OwnershipLink(BaseModel):
    holder: str
    holder_type: str = "natural_person"  # "natural_person", "corporate", "nominee"
    target: str
    percentage: Decimal
    citation: str = ""
    notes: Optional[str] = None


class ChainStep(BaseModel):
    holder: str
    holder_type: str
    target: str
    percentage: float
    citation: str


class UboResult(BaseModel):
    natural_person: str
    target_entity: str
    chain: List[ChainStep]
    effective_percentage: float
    formula: str


def compute_effective_ubo(links: List[OwnershipLink], target_entity: str) -> List[UboResult]:
    """
    Computes the effective holding of each natural person across layers by multiplying percentages
    along each chain using Decimal.
    Do not use the LLM for arithmetic.
    """
    # Build graph: target -> list of incoming links (holder -> target)
    # We want to find paths from natural persons to target_entity
    # Or start at target_entity and traverse backwards to natural persons.
    incoming: Dict[str, List[OwnershipLink]] = {}
    for link in links:
        incoming.setdefault(link.target.lower().strip(), []).append(link)

    results: List[UboResult] = []

    def find_paths(current_node: str, current_path: List[OwnershipLink], visited: set):
        links_to_node = incoming.get(current_node.lower().strip(), [])
        if not links_to_node:
            return

        for link in links_to_node:
            holder_key = link.holder.lower().strip()
            if holder_key in visited:
                continue  # prevent cycles

            new_path = [link] + current_path
            if link.holder_type == "natural_person":
                # Calculate effective percentage using Decimal
                factor = Decimal("1.0")
                percentages = []
                steps = []
                for step_link in new_path:
                    step_pct = step_link.percentage
                    percentages.append(f"{step_pct:g}%")
                    factor = factor * (step_pct / Decimal("100.0"))
                    steps.append(
                        ChainStep(
                            holder=step_link.holder,
                            holder_type=step_link.holder_type,
                            target=step_link.target,
                            percentage=float(step_link.percentage),
                            citation=step_link.citation,
                        )
                    )

                effective_decimal = (factor * Decimal("100.0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                effective_float = float(effective_decimal)
                formula = " × ".join(percentages) + f" = {effective_float:.1f}%"

                results.append(
                    UboResult(
                        natural_person=link.holder,
                        target_entity=target_entity,
                        chain=steps,
                        effective_percentage=effective_float,
                        formula=formula,
                    )
                )
            else:
                find_paths(link.holder, new_path, visited | {holder_key})

    find_paths(target_entity, [], set())
    return results


def calculate_simple_effective_percentage(chain_percentages: List[Decimal]) -> Decimal:
    """
    Multiplies percentages along a chain using Decimal.
    E.g. [Decimal('100.0'), Decimal('70.0')] -> Decimal('70.00')
    """
    factor = Decimal("1.0")
    for pct in chain_percentages:
        factor = factor * (pct / Decimal("100.0"))
    return (factor * Decimal("100.0")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

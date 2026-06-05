"""
AgentScribe - QA / Reviewer Agent (Python Engine)

Per AGENT_HARNESS.md, the QA agent cross-validates a freshly written scene
against the persisted world_bible state and flags any contradiction
(context drift, e.g. a severed arm being used).

This is the bare DSPy skeleton: a Signature, a ChainOfThought Module, and a
runnable __main__ demo with dummy data. API keys are loaded from .env, never
hardcoded.
"""

import os

import dspy
from dotenv import load_dotenv

# Load API keys / config from .env (never hardcode secrets).
load_dotenv()


class ContradictionCheck(dspy.Signature):
    """Decide whether the current scene contradicts the established world_bible state.

    Compare the scene's described actions/states against the canonical facts in
    world_bible_state. A contradiction is any logical conflict with a stored
    state value (e.g. a character using an arm recorded as "severed").
    """

    world_bible_state: str = dspy.InputField(
        desc="Canonical world/character state facts, e.g. JSON or key=value lines."
    )
    current_scene: str = dspy.InputField(
        desc="The newly written scene text to validate."
    )
    is_contradiction: bool = dspy.OutputField(
        desc="True if the scene contradicts the world_bible_state, else False."
    )
    explanation: str = dspy.OutputField(
        desc="Concise reason: which fact conflicts and how. Empty/none if no contradiction."
    )


class QAReviewer(dspy.Module):
    """QA agent: reasons step-by-step about scene-vs-state contradictions."""

    def __init__(self):
        super().__init__()
        self.check = dspy.ChainOfThought(ContradictionCheck)

    def forward(self, world_bible_state: str, current_scene: str) -> dspy.Prediction:
        return self.check(
            world_bible_state=world_bible_state,
            current_scene=current_scene,
        )


def _configure_lm() -> None:
    """Wire up the DSPy LM from environment variables."""
    model = os.getenv("QA_MODEL", "openai/gpt-4o-mini")
    # dspy.LM reads OPENAI_API_KEY / ANTHROPIC_API_KEY from env automatically.
    dspy.configure(lm=dspy.LM(model))


if __name__ == "__main__":
    # Dummy data to smoke-test the skeleton.
    dummy_state = (
        'character_A.name = "Kaelen"\n'
        'character_A.arm_status = "severed (left arm lost in Chapter 3)"\n'
        'location.current = "Ashfall Keep"'
    )
    dummy_scene = (
        "Kaelen gripped the greatsword with both hands and swung it in a wide arc, "
        "his left fist tightening on the hilt as he charged across Ashfall Keep."
    )

    _configure_lm()
    reviewer = QAReviewer()
    result = reviewer(world_bible_state=dummy_state, current_scene=dummy_scene)

    print("is_contradiction:", result.is_contradiction)
    print("explanation:", result.explanation)

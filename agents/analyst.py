"""Tailor Agent — rewrites resume bullets targeted to the specific role."""

import os
from uagents import Agent, Context
from shared import JobRequest, AgentResult

TAILOR_SEED = os.getenv("TAILOR_SEED", "tailor-careerforge-seed-phrase")

agent = Agent(
    name="Tailor",
    seed=TAILOR_SEED,
    port=8002,
    endpoint=["http://127.0.0.1:8002/submit"],
)


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Tailor agent started. Address: {agent.address}")


@agent.on_message(model=JobRequest)
async def handle_resume(ctx: Context, sender: str, msg: JobRequest):
    ctx.logger.info(f"Tailoring resume for {msg.job_title} at {msg.company}...")

    prompt = f"""You are Tailor, a resume optimization specialist. Using Scout's research below, rewrite and optimize the candidate's resume.

SCOUT'S RESEARCH:
{msg.previous_output}

CANDIDATE BACKGROUND: {msg.background}
TARGET ROLE: {msg.job_title} at {msg.company}

Provide:
1. **Optimized Summary** — 2-3 sentence professional summary tailored to this role
2. **Key Skills to Highlight** — ranked list with match scores
3. **Rewritten Experience Bullets** — transform their background into impactful bullets using the STAR method, with keywords from the job
4. **Keywords to Add** — ATS-friendly terms they should include
5. **Positioning Strategy** — how to frame their background for maximum impact

Be specific. Reference actual company values and role requirements from Scout's research."""

    result = AgentResult(
        agent_name="Tailor",
        stage="resume",
        result=prompt,
    )
    await ctx.send(sender, result)


if __name__ == "__main__":
    agent.run()

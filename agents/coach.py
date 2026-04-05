"""Socrates Agent — predicts interview questions and provides answer frameworks."""

import os
from uagents import Agent, Context
from shared import JobRequest, AgentResult

SOCRATES_SEED = os.getenv("SOCRATES_SEED", "socrates-careerforge-seed-phrase")

agent = Agent(
    name="Socrates",
    seed=SOCRATES_SEED,
    port=8003,
    endpoint=["http://127.0.0.1:8003/submit"],
)


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Socrates agent started. Address: {agent.address}")


@agent.on_message(model=JobRequest)
async def handle_interview(ctx: Context, sender: str, msg: JobRequest):
    ctx.logger.info(f"Prepping interview for {msg.job_title} at {msg.company}...")

    prompt = f"""You are Socrates, an interview preparation coach. Using the research and resume analysis below, predict interview questions and build answer frameworks.

PREVIOUS AGENTS' WORK:
{msg.previous_output}

CANDIDATE: {msg.background}
ROLE: {msg.job_title} at {msg.company}

Provide:
1. **Top 5 Behavioral Questions** — most likely questions with STAR-format answer outlines using the candidate's actual background
2. **Top 5 Technical Questions** — role-specific technical questions with key points to hit
3. **The "Why This Company?" Answer** — a compelling, specific response using Scout's research
4. **Curveball Questions** — 3 unexpected questions with strategies
5. **Questions to Ask Them** — 3 smart questions that show research and genuine interest

Make answers specific to this candidate and company, not generic."""

    result = AgentResult(
        agent_name="Socrates",
        stage="interview",
        result=prompt,
    )
    await ctx.send(sender, result)


if __name__ == "__main__":
    agent.run()

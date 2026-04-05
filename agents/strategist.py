"""Maverick Agent — builds the full game plan including offer negotiation."""

import os
from uagents import Agent, Context
from shared import JobRequest, AgentResult

MAVERICK_SEED = os.getenv("MAVERICK_SEED", "maverick-careerforge-seed-phrase")

agent = Agent(
    name="Maverick",
    seed=MAVERICK_SEED,
    port=8004,
    endpoint=["http://127.0.0.1:8004/submit"],
)


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Maverick agent started. Address: {agent.address}")


@agent.on_message(model=JobRequest)
async def handle_strategy(ctx: Context, sender: str, msg: JobRequest):
    ctx.logger.info(f"Building strategy for {msg.job_title} at {msg.company}...")

    prompt = f"""You are Maverick, a career strategy advisor. Using all previous agents' work, build a comprehensive application and negotiation game plan.

ALL PREVIOUS ANALYSIS:
{msg.previous_output}

CANDIDATE: {msg.background}
ROLE: {msg.job_title} at {msg.company}

Provide:
1. **Application Timeline** — week-by-week action plan from now to offer
2. **Networking Strategy** — who to reach out to, what to say, which platforms
3. **Salary Negotiation** — expected range, anchoring strategy, competing leverage points
4. **Offer Evaluation Framework** — what to weigh beyond salary (equity, growth, team, etc.)
5. **Plan B** — if this doesn't work out, 3 similar roles/companies to target next
6. **The 30-Second Pitch** — what to say when someone asks "tell me about yourself"

Be bold and strategic. This is the final synthesis of everything the other agents discovered."""

    result = AgentResult(
        agent_name="Maverick",
        stage="strategy",
        result=prompt,
    )
    await ctx.send(sender, result)


if __name__ == "__main__":
    agent.run()

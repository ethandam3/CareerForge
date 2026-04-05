"""Scout Agent — researches the company, culture, and role."""

import os
from uagents import Agent, Context
from shared import JobRequest, AgentResult

SCOUT_SEED = os.getenv("SCOUT_SEED", "scout-careerforge-seed-phrase")

agent = Agent(
    name="Scout",
    seed=SCOUT_SEED,
    port=8001,
    endpoint=["http://127.0.0.1:8001/submit"],
)


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Scout agent started. Address: {agent.address}")


@agent.on_message(model=JobRequest)
async def handle_research(ctx: Context, sender: str, msg: JobRequest):
    ctx.logger.info(f"Researching {msg.company} for {msg.job_title}...")

    # In production, this would call Fetch.ai's ASI:One or an external API
    # For the hackathon demo, we use a structured prompt via the orchestrator
    prompt = f"""You are Scout, a company research specialist. Research this:
Company: {msg.company}
Role: {msg.job_title}
Candidate Background: {msg.background}

Provide a detailed briefing covering:
1. Company mission, culture, and recent news
2. What this specific role likely involves day-to-day
3. Key technologies and skills they value
4. Interview culture and what they look for in candidates
5. Red flags or things the candidate should know

Be specific and actionable. This briefing will be used by other agents to tailor a resume and prep interview questions."""

    result = AgentResult(
        agent_name="Scout",
        stage="research",
        result=prompt,
    )
    await ctx.send(sender, result)


if __name__ == "__main__":
    agent.run()

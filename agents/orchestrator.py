"""Orchestrator — coordinates the 4-agent pipeline and calls LLM for each stage."""

import os
import json
import asyncio
from uagents import Agent, Context
from shared import JobRequest, AgentResult

ORCHESTRATOR_SEED = os.getenv("ORCHESTRATOR_SEED", "orchestrator-careerforge-seed")

agent = Agent(
    name="Orchestrator",
    seed=ORCHESTRATOR_SEED,
    port=8000,
    endpoint=["http://127.0.0.1:8000/submit"],
)

# Agent addresses — fill these in after starting each agent
AGENT_ADDRESSES = {
    "research": os.getenv("SCOUT_ADDRESS", "PASTE_SCOUT_ADDRESS_HERE"),
    "resume": os.getenv("TAILOR_ADDRESS", "PASTE_TAILOR_ADDRESS_HERE"),
    "interview": os.getenv("SOCRATES_ADDRESS", "PASTE_SOCRATES_ADDRESS_HERE"),
    "strategy": os.getenv("MAVERICK_ADDRESS", "PASTE_MAVERICK_ADDRESS_HERE"),
}

STAGES = ["research", "resume", "interview", "strategy"]

# Store for in-progress pipelines
pipelines = {}


@agent.on_event("startup")
async def startup(ctx: Context):
    ctx.logger.info(f"Orchestrator started. Address: {agent.address}")
    ctx.logger.info(f"Agent addresses: {json.dumps(AGENT_ADDRESSES, indent=2)}")


@agent.on_message(model=JobRequest)
async def start_pipeline(ctx: Context, sender: str, msg: JobRequest):
    """Receive initial request and kick off the pipeline."""
    pipeline_id = f"{msg.company}-{msg.job_title}".replace(" ", "-").lower()
    ctx.logger.info(f"Starting pipeline: {pipeline_id}")

    pipelines[pipeline_id] = {
        "sender": sender,
        "request": msg,
        "results": {},
        "current_stage": 0,
    }

    # Send to first agent (Scout)
    first_stage = STAGES[0]
    await ctx.send(
        AGENT_ADDRESSES[first_stage],
        JobRequest(
            job_title=msg.job_title,
            company=msg.company,
            background=msg.background,
            stage=first_stage,
            previous_output="",
        ),
    )


@agent.on_message(model=AgentResult)
async def handle_result(ctx: Context, sender: str, msg: AgentResult):
    """Receive result from an agent and route to the next one."""
    ctx.logger.info(f"Received result from {msg.agent_name} ({msg.stage})")

    # Find the pipeline this result belongs to
    for pid, pipeline in pipelines.items():
        if STAGES[pipeline["current_stage"]] == msg.stage:
            pipeline["results"][msg.stage] = msg.result
            pipeline["current_stage"] += 1

            # Check if pipeline is complete
            if pipeline["current_stage"] >= len(STAGES):
                ctx.logger.info(f"Pipeline {pid} complete!")
                # Send final results back to the API server
                final = AgentResult(
                    agent_name="Orchestrator",
                    stage="complete",
                    result=json.dumps(pipeline["results"]),
                )
                await ctx.send(pipeline["sender"], final)
                del pipelines[pid]
            else:
                # Send to next agent with accumulated context
                next_stage = STAGES[pipeline["current_stage"]]
                accumulated = "\n\n---\n\n".join(
                    f"[{s.upper()}]: {pipeline['results'][s]}"
                    for s in STAGES[: pipeline["current_stage"]]
                )
                await ctx.send(
                    AGENT_ADDRESSES[next_stage],
                    JobRequest(
                        job_title=pipeline["request"].job_title,
                        company=pipeline["request"].company,
                        background=pipeline["request"].background,
                        stage=next_stage,
                        previous_output=accumulated,
                    ),
                )
            break


if __name__ == "__main__":
    agent.run()

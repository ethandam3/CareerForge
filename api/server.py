"""FastAPI server — bridges the React frontend to the uAgents pipeline.

Supports two modes:
1. Full mode: routes requests through the Fetch.ai agent network
2. Direct mode (USE_AGENTS=false): calls Claude API directly for fast demos
"""

import os
import json
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import anthropic

app = FastAPI(title="CareerForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

USE_AGENTS = os.getenv("USE_AGENTS", "false").lower() == "true"
client = anthropic.Anthropic()

AGENT_PROMPTS = {
    "research": """You are Scout, a company research specialist. Research this:
Company: {company}
Role: {job_title}
Candidate Background: {background}

Provide a detailed briefing covering:
1. Company mission, culture, and recent news
2. What this specific role likely involves day-to-day
3. Key technologies and skills they value
4. Interview culture and what they look for in candidates
5. Red flags or things the candidate should know

Be specific and actionable.""",
    "resume": """You are Tailor, a resume optimization specialist. Using Scout's research below, optimize the candidate's resume.

SCOUT'S RESEARCH:
{previous_output}

CANDIDATE BACKGROUND: {background}
TARGET ROLE: {job_title} at {company}

Provide:
1. **Optimized Summary** — 2-3 sentence professional summary
2. **Key Skills to Highlight** — ranked list with match scores
3. **Rewritten Experience Bullets** — STAR method, with role keywords
4. **Keywords to Add** — ATS-friendly terms
5. **Positioning Strategy** — how to frame their background""",
    "interview": """You are Socrates, an interview preparation coach. Using the prior analysis, predict interview questions.

PREVIOUS ANALYSIS:
{previous_output}

CANDIDATE: {background}
ROLE: {job_title} at {company}

Provide:
1. **Top 5 Behavioral Questions** — with STAR answer outlines
2. **Top 5 Technical Questions** — with key points
3. **"Why This Company?" Answer** — specific, compelling
4. **Curveball Questions** — 3 unexpected ones with strategies
5. **Questions to Ask Them** — 3 smart questions""",
    "strategy": """You are Maverick, a career strategy advisor. Build a comprehensive game plan.

ALL PREVIOUS ANALYSIS:
{previous_output}

CANDIDATE: {background}
ROLE: {job_title} at {company}

Provide:
1. **Application Timeline** — week-by-week action plan
2. **Networking Strategy** — who, what, where
3. **Salary Negotiation** — range, anchoring, leverage
4. **Offer Evaluation Framework** — beyond salary
5. **Plan B** — 3 similar roles/companies
6. **30-Second Pitch** — "tell me about yourself" answer""",
}

STAGES = ["research", "resume", "interview", "strategy"]
STAGE_NAMES = {
    "research": "Scout",
    "resume": "Tailor",
    "interview": "Socrates",
    "strategy": "Maverick",
}


@app.post("/api/analyze")
async def analyze(request: Request):
    body = await request.json()
    job_title = body["jobTitle"]
    company = body["company"]
    background = body["background"]

    async def event_stream():
        previous_output = ""

        for stage in STAGES:
            agent_name = STAGE_NAMES[stage]
            yield f"data: {json.dumps({'type': 'stage_start', 'stage': stage, 'agent': agent_name})}\n\n"

            prompt = AGENT_PROMPTS[stage].format(
                job_title=job_title,
                company=company,
                background=background,
                previous_output=previous_output,
            )

            full_response = ""
            with client.messages.stream(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                for text in stream.text_stream:
                    full_response += text
                    yield f"data: {json.dumps({'type': 'token', 'stage': stage, 'token': text})}\n\n"

            previous_output += f"\n\n[{agent_name.upper()} ANALYSIS]:\n{full_response}"

            yield f"data: {json.dumps({'type': 'stage_complete', 'stage': stage, 'result': full_response})}\n\n"

        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/ds-analysis")
async def ds_analysis(request: Request):
    """Run the data science analysis layer."""
    body = await request.json()

    prompt = f"""You are a data science analyst. Given the following job application context, produce a structured JSON analysis.

Job Title: {body['jobTitle']}
Company: {body['company']}
Candidate Background: {body['background']}
Agent Results Summary: {body.get('agentSummary', 'N/A')}

Return ONLY valid JSON with this exact structure:
{{
  "salary": {{
    "p25": <number>,
    "p50": <number>,
    "p75": <number>,
    "currency": "USD",
    "location": "<primary location>",
    "insight": "<1 sentence about market positioning>"
  }},
  "marketTrend": {{
    "months": ["Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"],
    "postings": [<6 numbers representing relative job posting volume>],
    "yoyGrowth": <percentage as number>,
    "topCities": ["<city1>", "<city2>", "<city3>"]
  }},
  "skillsGap": {{
    "matchScore": <0-100>,
    "required": [
      {{"skill": "<name>", "has": true/false, "importance": "critical"/"important"/"nice-to-have"}}
    ],
    "criticalGaps": ["<skill1>", "<skill2>"],
    "verdict": "<1 sentence assessment>"
  }}
}}

Be realistic with salary data based on current market rates. Analyze the candidate's actual background against typical requirements."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    # Parse the JSON from the response
    response_text = message.content[0].text
    # Try to extract JSON from the response
    try:
        # Handle case where model wraps JSON in markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        data = json.loads(response_text.strip())
    except json.JSONDecodeError:
        data = {"error": "Failed to parse analysis", "raw": response_text}

    return data


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)

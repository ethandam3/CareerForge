"""FastAPI server — bridges the React frontend to the uAgents pipeline."""

import os
import json
from pathlib import Path
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import google.generativeai as genai
import pdfplumber
import io

app = FastAPI(title="CareerForge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"

genai.configure(api_key=os.getenv("GEMINI_API_KEY", "AIzaSyCGp9vAaBvvO9sm0I6OpejRRyFul1mrBAc"))
# Using 2.5-flash as you requested. It is incredibly fast for this use case.
model = genai.GenerativeModel("gemini-2.5-flash")

SYSTEM_PREFIX = """You are speaking directly to the candidate. Be specific to their background — reference their actual experience, education, and skills when available. If no resume is provided, give the best advice you can based on whatever background info they shared. The candidate may be applying to ANY industry or career path (tech, healthcare, trades, education, business, etc.). Do not assume tech. Adapt your advice to their specific field. Use bullet points for readability. IMPORTANT: Never output raw markdown bold markers like **text** — just write the text plainly. Use ## for section headers only."""

AGENT_PROMPTS = {
    "research": SYSTEM_PREFIX + """

You are Scout, a research specialist. Investigate this opportunity:

Organization: {company}
Role/Program: {job_title}
Candidate Background: {background}

Provide exactly 3 sections with detailed, helpful content:

## Organization Snapshot
3-4 bullets on what this organization does, their mission, culture, recent news, and reputation in the field. Give enough context that someone unfamiliar would understand what they're getting into.

## Role Reality
4-5 bullets on what this role actually involves day-to-day, what a typical week looks like, what success looks like in the first 6 months, and common challenges. Be specific to this organization.

## What They Value
4-5 bullets on the key skills, qualities, certifications, and experience they prioritize. If the candidate shared their background, call out specific things from their experience that align well.""",

    "resume": SYSTEM_PREFIX + """

You are Tailor, a resume and application optimization specialist.

SCOUT'S RESEARCH:
{previous_output}

CANDIDATE BACKGROUND: {background}
TARGET: {job_title} at {company}

Provide exactly 4 sections with actionable, detailed advice:

## Professional Summary
Write a 3-4 sentence summary tailored to this specific role and organization. If they shared their experience, weave in their strongest relevant qualifications. If not, write a template they can customize.

## Key Skills to Highlight
List 6-8 skills to emphasize, explaining why each one matters for this specific role. Note which ones the candidate likely has vs. needs to develop.

## Experience Bullets to Strengthen
Provide 4-5 example bullet points they should use or adapt, written with strong action verbs and measurable impact. Base these on their actual experience if shared, or provide templates relevant to the role.

## Keywords and Phrases to Include
List 6-8 specific terms, certifications, or phrases that are important for this role and field. Explain briefly why each matters (e.g., ATS filtering, industry standard, etc.).""",

    "interview": SYSTEM_PREFIX + """

You are Socrates, an interview and application coach.

PREVIOUS ANALYSIS:
{previous_output}

CANDIDATE: {background}
ROLE: {job_title} at {company}

Provide exactly 4 sections with detailed, actionable guidance:

## Top 4 Likely Questions
The 4 most probable interview or application questions. For each one, provide:
- The question itself
- A 3-4 sentence answer framework showing exactly how to structure the response
- If the candidate shared their background, use specific examples from their experience

## Your "Why Here?" Answer
Write a specific, compelling 4-5 sentence answer that connects the candidate's background to this organization's mission and this role. Make it personal and authentic, not generic.

## Curveball to Prepare For
1 unexpected or tough question with a detailed strategy for handling it, including a sample response outline.

## Smart Questions to Ask Them
3 thoughtful questions that demonstrate research and genuine interest. For each, explain what it signals to the interviewer.""",

    "strategy": SYSTEM_PREFIX + """

You are Maverick, a career strategy advisor.

ALL PREVIOUS ANALYSIS:
{previous_output}

CANDIDATE: {background}
ROLE: {job_title} at {company}

Provide exactly 4 sections with detailed, actionable advice:

## Networking Strategy
4-5 bullets on who specifically to connect with (job titles, communities, platforms), what to say in outreach messages, and how to build relationships in this field. Be specific — not just "use LinkedIn."

## Compensation and Negotiation
Expected salary/compensation range for this role and level. Include 3 specific negotiation tips or leverage points relevant to this field and the candidate's profile.

## Plan B
3 alternative roles or organizations to pursue, with a 1-2 sentence explanation of why each is a good fit based on the candidate's background.

## Your 30-Second Pitch
Write a complete, specific "tell me about yourself" answer (5-6 sentences) that the candidate can practice and use. Base it on their actual background if shared.

Then output this EXACT section at the end. Do NOT use ** bold markers in the titles — write them as plain text:

## TIMELINE
- STEP 1: [plain text action title] | [2-3 sentence description with specific actions to take, resources to use, and expected outcomes]
- STEP 2: [plain text action title] | [2-3 sentence description with specific actions to take, resources to use, and expected outcomes]
- STEP 3: [plain text action title] | [2-3 sentence description with specific actions to take, resources to use, and expected outcomes]
- STEP 4: [plain text action title] | [2-3 sentence description with specific actions to take, resources to use, and expected outcomes]
- STEP 5: [plain text action title] | [2-3 sentence description with specific actions to take, resources to use, and expected outcomes]

Make the timeline a realistic 5-step roadmap from today to achieving this goal. Each step should have enough detail that the candidate knows exactly what to do.""",
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
            try:
                # CHANGED: Now using the async method so FastAPI doesn't freeze
                response = await model.generate_content_async(prompt, stream=True)
                async for chunk in response: # CHANGED: Async iteration
                    if chunk.text:
                        full_response += chunk.text
                        yield f"data: {json.dumps({'type': 'token', 'stage': stage, 'token': chunk.text})}\n\n"
            except Exception as e:
                full_response = f"Error: {str(e)}"
                yield f"data: {json.dumps({'type': 'token', 'stage': stage, 'token': full_response})}\n\n"

            previous_output += f"\n\n[{agent_name.upper()} ANALYSIS]:\n{full_response}"
            yield f"data: {json.dumps({'type': 'stage_complete', 'stage': stage, 'result': full_response})}\n\n"

        yield f"data: {json.dumps({'type': 'complete'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.post("/api/ds-analysis")
async def ds_analysis(request: Request):
    body = await request.json()

    prompt = f"""You are a data science analyst. Given the following job application context, produce a structured JSON analysis.

Job Title: {body['jobTitle']}
Company: {body['company']}
Candidate Background: {body['background']}
Agent Results Summary: {body.get('agentSummary', 'N/A')}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just raw JSON):
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

Be realistic with salary data based on current market rates."""

    # CHANGED: Also updated the Data Science route to be async so it is snappy
    response = await model.generate_content_async(prompt)
    response_text = response.text
    try:
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        data = json.loads(response_text.strip())
    except json.JSONDecodeError:
        data = {"error": "Failed to parse analysis", "raw": response_text}

    return data


@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """Extract text from an uploaded PDF resume."""
    try:
        contents = await file.read()
        text = ""
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        if not text.strip():
            return {"error": "Could not extract text from PDF"}
        return {"text": text.strip()}
    except Exception as e:
        return {"error": f"Failed to parse PDF: {str(e)}"}


# Serve React frontend
if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        return FileResponse(DIST_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
# CareerForge — DiamondHacks 3.0

## What this is
Multi-agent job application coach. 4 uAgents (Scout, Tailor, Socrates, Maverick)
coordinate via Fetch.ai to research companies, tailor resumes, prep interviews,
and build offer strategy. React frontend + FastAPI bridge + DS analytics layer.

## Structure
- agents/orchestrator.py — pipeline coordinator
- agents/researcher.py, analyst.py, coach.py, strategist.py — the 4 uAgents
- agents/shared.py — shared message models
- api/server.py — FastAPI SSE bridge
- frontend/src/CareerForge.jsx — main UI
- frontend/src/DSAnalytics.jsx — salary model, market trend, skills gap
- frontend/src/App.jsx — app shell
- frontend/src/main.jsx — entry point

## Key design principles (from hackathon research)
1. Fetch.ai is the skeleton, not decoration — real uAgents with message passing
2. Demoable in 30 seconds — USE_BACKEND flag for fallback mode
3. Right-sized scope — each agent ~40 lines, nothing over-engineered

## Target prizes
- Best Use of Fetch.ai ($300 + internship interview)
- DS angle: salary model, market trends, skills gap analysis

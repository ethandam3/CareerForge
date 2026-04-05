# CareerForge Setup

## Quick Start (Demo Mode — no Python needed)

```bash
cd frontend
npm install
npm run dev
```

Set `USE_BACKEND = false` in `src/CareerForge.jsx` line 4 for offline demo mode.

## Full Setup (with FastAPI + uAgents)

### 1. Backend
```bash
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 2. Start the API server
```bash
cd api
python server.py
```

### 3. (Optional) Start uAgents
In separate terminals:
```bash
cd agents && python researcher.py
cd agents && python analyst.py
cd agents && python coach.py
cd agents && python strategist.py
cd agents && python orchestrator.py
```
Copy each agent's printed address into `orchestrator.py` or `.env`.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev
```

## Judge Pitch (30 seconds)

> "CareerForge is a multi-agent job application coach. You enter a role and company,
> and four specialized AI agents — Scout, Tailor, Socrates, and Maverick — coordinate
> through Fetch.ai's uAgents framework to research the company, optimize your resume,
> prep interview answers, and build an offer negotiation strategy. Each agent receives
> the previous agent's output, so the analysis compounds. We also built a data science
> layer on top — salary modeling, market trend analysis, and skills gap scoring —
> because we're data science students and wanted to show structured quantitative
> analysis, not just LLM output."

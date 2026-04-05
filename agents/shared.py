from uagents import Model


class JobRequest(Model):
    job_title: str
    company: str
    background: str
    stage: str  # "research" | "resume" | "interview" | "strategy"
    previous_output: str  # output from the previous agent


class AgentResult(Model):
    agent_name: str
    stage: str
    result: str

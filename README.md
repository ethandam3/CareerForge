# CareerForge

CareerForge is a personalized Socratic career coach that transforms generic job advice into your own specialized Career Quartet. Instead of watching broad career videos or scrolling through endless job boards I built this to provide mentorship that is actually catered to your specific background and goals.

## Inspiration

The inspiration for CareerForge came from my own frustrating experience of hunting for internships. I was spending hours on Jobright and scrolling through endless YouTube career advice videos but everything felt too generic. Even the best videos offer advice meant for a massive audience rather than focusing on my specific background as a data science student. I realized that the most effective career guidance should be a Socratic experience that challenges you based on your unique resume and goals. I wanted to build something that provides personalized mentorship at scale helping people get advice that is actually catered to them rather than a broad group.

## The Career Quartet

I built CareerForge using a multi agent architecture orchestrated through the Fetch.ai uAgents framework. The system consists of four distinct agents.

* **Scout** The researcher responsible for deep dives into company culture and market trends.
* **Tailor** The optimization specialist that aligns your resume with complex job descriptions.
* **Socrates** The interview coach providing real time Socratic style mock interviews.
* **Maverick** The negotiation expert focused on salary modeling and offer strategy.

## How I Built It

The brain of the project is Google Gemini 1.5 Flash which handles the complex reasoning for each agent. I built the backend with FastAPI to handle asynchronous communication between the agents and used React for the frontend to create a clean interactive user interface. To make the Socrates agent feel like a real coach I implemented streaming responses so the interview practice feels like a live conversation.

## Challenges I Faced

One of the biggest challenges was managing the state between the frontend and the multiple AI agents running in the background. Since I had four different agents potentially talking to each other ensuring the data flowed correctly from the Scout agent to the Maverick agent without high latency was difficult. I also ran into technical hurdles with API rate limits and zero quota errors when I first started testing which required careful debugging of the message passing logic.

## What I Learned

This project taught me a lot about agentic workflows and how to bridge the gap between a data science layer and a functional full stack app. I learned how to optimize prompts for specific personas and realized that the real value of GenAI comes from how you structure the interaction to solve a specific personal pain point like the internship search.

## Tech Stack

* Python
* JavaScript
* React
* FastAPI
* Fetch.ai uAgents
* Google Gemini 1.5 Flash
* Node.js

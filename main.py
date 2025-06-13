# Dodaj ścieżkę do agenta na początku
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Downloads", "openai-agents-python", "src")))

from fastapi import FastAPI
from openai_agents.agent import Agent  # ← zadziała, bo teraz to fizycznie istnieje

app = FastAPI()

@app.post("/generate-diet")
async def generate_diet(state: dict):
    return {"message": "Agent soon here – placeholder"}


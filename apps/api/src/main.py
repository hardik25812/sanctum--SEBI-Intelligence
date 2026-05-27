from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.traces import router as traces_router
from src.api.intake import router as intake_router
from src.api.evals import router as evals_router

app = FastAPI(title="Sanctum API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(traces_router)
app.include_router(intake_router)
app.include_router(evals_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}

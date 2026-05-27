import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api.traces import router as traces_router
from src.api.intake import router as intake_router
from src.api.evals import router as evals_router
from src.api.review import router as review_router
from src.middleware.rate_limit import RateLimitMiddleware

app = FastAPI(title="Sanctum API", version="0.1.0")

app.add_middleware(RateLimitMiddleware, max_requests=10, window_seconds=60)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": str(exc)})

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
app.include_router(review_router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}

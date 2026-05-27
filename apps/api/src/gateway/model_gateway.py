from src.gateway.anthropic_client import AnthropicClient
from src.gateway.openai_client import OpenAIClient
from src.settings import settings


class ModelGateway:
    def __init__(self):
        self.anthropic = AnthropicClient(api_key=settings.anthropic_api_key)
        self.openai = OpenAIClient(api_key=settings.openai_api_key)

    async def call_primary(self, prompt: str, system: str = "") -> str:
        return await self.anthropic.complete(
            model="claude-opus-4-5",
            prompt=prompt,
            system=system,
        )

    async def call_cross_check(self, prompt: str, system: str = "") -> str:
        return await self.openai.complete(
            model="gpt-4o",
            prompt=prompt,
            system=system,
        )

    async def call_cheap(self, prompt: str, system: str = "") -> str:
        return await self.openai.complete(
            model="gpt-4o-mini",
            prompt=prompt,
            system=system,
        )

    async def embed(self, text: str) -> list[float]:
        return await self.openai.embed(text=text, model="text-embedding-3-small")

    async def smoke_test(self) -> dict:
        results = {}
        try:
            resp = await self.anthropic.complete(
                model="claude-opus-4-5",
                prompt="Reply with exactly: OK",
                system="You are a test assistant.",
            )
            results["anthropic"] = {"status": "ok", "response": resp[:50]}
        except Exception as e:
            results["anthropic"] = {"status": "error", "error": str(e)}

        try:
            resp = await self.openai.complete(
                model="gpt-4o",
                prompt="Reply with exactly: OK",
                system="You are a test assistant.",
            )
            results["openai"] = {"status": "ok", "response": resp[:50]}
        except Exception as e:
            results["openai"] = {"status": "error", "error": str(e)}

        return results


gateway = ModelGateway()

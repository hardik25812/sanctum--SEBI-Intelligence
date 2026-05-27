import openai


class OpenAIClient:
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def complete(self, model: str, prompt: str, system: str = "") -> str:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=4096,
        )
        return response.choices[0].message.content

    async def embed(self, text: str, model: str = "text-embedding-3-small") -> list[float]:
        response = await self.client.embeddings.create(
            model=model,
            input=text,
        )
        return response.data[0].embedding

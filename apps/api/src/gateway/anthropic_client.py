import anthropic


class AnthropicClient:
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)

    async def complete(self, model: str, prompt: str, system: str = "") -> str:
        message = await self.client.messages.create(
            model=model,
            max_tokens=4096,
            system=system if system else "You are a SEBI-compliant wealth advisory assistant.",
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text

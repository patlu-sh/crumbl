from pydantic import BaseModel, Field


class RateLimitErrorResponse(BaseModel):
    error: str = Field(
        default="Rate limit exceeded",
        description="Human-readable error message.",
        examples=["Rate limit exceeded"],
    )
    retry_after_seconds: int = Field(
        ...,
        description="Number of seconds the client must wait before trying again.",
        examples=[30],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"error": "Rate limit exceeded", "retry_after_seconds": 30}]
        }
    }

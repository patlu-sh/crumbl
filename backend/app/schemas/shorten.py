from pydantic import BaseModel, Field


class ShortenRequest(BaseModel):
    url: str = Field(
        ...,
        description="The full destination URL to shorten. Must be a valid HTTP or HTTPS URL.",
        examples=["https://www.example.com/some/very/long/path?query=value"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"url": "https://www.example.com/some/very/long/path?query=value"}
            ]
        }
    }


class ShortenResponse(BaseModel):
    alias: str = Field(
        ...,
        description="The 6-character alphanumeric alias identifying this short URL.",
        examples=["aB3xYz"],
    )
    short_url: str = Field(
        ...,
        description="The fully-qualified short URL that will redirect to the original destination.",
        examples=["https://crumbl.io/aB3xYz"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"alias": "aB3xYz", "short_url": "https://crumbl.io/aB3xYz"}
            ]
        }
    }

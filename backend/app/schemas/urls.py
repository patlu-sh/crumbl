from pydantic import BaseModel, Field


class UrlListItem(BaseModel):
    alias: str = Field(..., description="6-character alphanumeric alias.", examples=["aB3xYz"])
    original_url: str = Field(..., description="The destination URL this alias redirects to.", examples=["https://www.example.com/page"])
    total_clicks: int = Field(..., description="Cumulative number of redirect clicks.", examples=[42])
    archived: bool = Field(..., description="Whether this URL has been archived (soft-deleted).", examples=[False])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "alias": "aB3xYz",
                    "original_url": "https://www.example.com/page",
                    "total_clicks": 42,
                    "archived": False,
                }
            ]
        }
    }


class UpdateUrlRequest(BaseModel):
    original_url: str = Field(
        ...,
        description="The new destination URL to assign to this alias.",
        examples=["https://www.new-destination.com/page"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"original_url": "https://www.new-destination.com/page"}]
        }
    }


class ArchiveUrlRequest(BaseModel):
    archived: bool = Field(
        ...,
        description="Set to `true` to archive the URL or `false` to restore it.",
        examples=[True],
    )

    model_config = {
        "json_schema_extra": {"examples": [{"archived": True}]}
    }

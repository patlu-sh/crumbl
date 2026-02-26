from pydantic import BaseModel, Field


class DayCount(BaseModel):
    date: str = Field(..., description="Calendar date in `YYYY-MM-DD` format.", examples=["2026-02-25"])
    clicks: int = Field(..., description="Number of redirect clicks recorded on this date.", examples=[17])

    model_config = {
        "json_schema_extra": {"examples": [{"date": "2026-02-25", "clicks": 17}]}
    }


class AnalyticsResponse(BaseModel):
    alias: str = Field(..., description="The alias whose analytics are returned.", examples=["aB3xYz"])
    clicks_by_day: list[DayCount] = Field(
        ...,
        description="Click counts for each of the last 7 calendar days, ordered oldest-first.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "alias": "aB3xYz",
                    "clicks_by_day": [
                        {"date": "2026-02-19", "clicks": 5},
                        {"date": "2026-02-20", "clicks": 8},
                        {"date": "2026-02-21", "clicks": 3},
                        {"date": "2026-02-22", "clicks": 12},
                        {"date": "2026-02-23", "clicks": 7},
                        {"date": "2026-02-24", "clicks": 9},
                        {"date": "2026-02-25", "clicks": 17},
                    ],
                }
            ]
        }
    }

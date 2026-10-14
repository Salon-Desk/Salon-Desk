from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class ServiceCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None
    price: Decimal = Field(ge=0)
    duration_minutes: int = Field(gt=0)
    max_capacity: int = Field(default=1, ge=1)


class ServiceOut(BaseModel):
    id: UUID
    name: str
    price: Decimal
    duration_minutes: int
    max_capacity: int
    category: str | None = None

    model_config = {"from_attributes": True}

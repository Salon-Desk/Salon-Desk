from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MessageOut(BaseModel):
    detail: str


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IdOut(ORMModel):
    id: UUID

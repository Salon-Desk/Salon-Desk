from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class MessageOut(BaseModel):
    detail: str


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class IdOut(ORMModel):
    id: UUID


class PageOut(BaseModel, Generic[T]):
    items: list[T]
    page: int
    page_size: int
    total: int
    has_more: bool


PaginatedResponse = PageOut

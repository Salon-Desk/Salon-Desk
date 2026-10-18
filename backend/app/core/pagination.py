from collections.abc import Sequence
from typing import Any, TypeVar

from pydantic import BaseModel
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.common import PageOut

T = TypeVar("T")


async def paginate_query(
    db: AsyncSession,
    stmt: Select[Any],
    page: int = 1,
    page_size: int = 20,
    schema: type[BaseModel] | None = None,
) -> PageOut[Any]:
    """Execute a query with offset/limit pagination and count total items."""
    count_subquery = stmt.order_by(None).subquery()
    count_stmt = select(func.count()).select_from(count_subquery)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one() or 0

    offset = max(0, (page - 1) * page_size)
    paged_stmt = stmt.offset(offset).limit(page_size)
    result = await db.execute(paged_stmt)
    rows = result.scalars().all()

    items = [schema.model_validate(r) for r in rows] if schema is not None else list(rows)

    has_more = (offset + len(items)) < total
    return PageOut(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        has_more=has_more,
    )


def paginate_items(
    items: Sequence[T],
    page: int = 1,
    page_size: int = 20,
) -> PageOut[T]:
    """In-memory slicing of an already fetched or cached list."""
    total = len(items)
    offset = max(0, (page - 1) * page_size)
    paged = list(items[offset : offset + page_size])
    has_more = (offset + len(paged)) < total
    return PageOut(
        items=paged,
        page=page,
        page_size=page_size,
        total=total,
        has_more=has_more,
    )

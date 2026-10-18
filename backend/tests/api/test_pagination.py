"""Tests for pagination helper and PageOut schemas."""

from pydantic import BaseModel

from app.core.pagination import paginate_items
from app.schemas.common import PageOut


class SampleItem(BaseModel):
    id: int
    name: str


def test_page_out_schema() -> None:
    page = PageOut[SampleItem](
        items=[SampleItem(id=1, name="Test")],
        page=1,
        page_size=10,
        total=1,
        has_more=False,
    )
    assert page.total == 1
    assert page.page == 1
    assert len(page.items) == 1
    assert page.has_more is False


def test_paginate_items_multi_page() -> None:
    data = [SampleItem(id=i, name=f"Item {i}") for i in range(1, 26)]
    # Page 1 with size 10
    page1 = paginate_items(data, page=1, page_size=10)
    assert len(page1.items) == 10
    assert page1.total == 25
    assert page1.page == 1
    assert page1.has_more is True
    assert page1.items[0].id == 1
    assert page1.items[-1].id == 10

    # Page 2 with size 10
    page2 = paginate_items(data, page=2, page_size=10)
    assert len(page2.items) == 10
    assert page2.total == 25
    assert page2.page == 2
    assert page2.has_more is True
    assert page2.items[0].id == 11
    assert page2.items[-1].id == 20

    # Page 3 with size 10 (last page)
    page3 = paginate_items(data, page=3, page_size=10)
    assert len(page3.items) == 5
    assert page3.total == 25
    assert page3.page == 3
    assert page3.has_more is False
    assert page3.items[0].id == 21
    assert page3.items[-1].id == 25


def test_paginate_items_empty() -> None:
    empty_page = paginate_items([], page=1, page_size=10)
    assert len(empty_page.items) == 0
    assert empty_page.total == 0
    assert empty_page.has_more is False

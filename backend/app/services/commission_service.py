"""Platform commission rules and amount calculations for bookings and catalog."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ledger import PlatformCommission
from app.models.service import Service

__all__ = [
    "commission_amount",
    "commission_rule_for_category",
    "commission_rule_for_service",
    "total_platform_commission_for_services",
]


async def commission_rule_for_category(db: AsyncSession, service_category_id: UUID) -> dict:
    result = await db.execute(
        select(PlatformCommission)
        .where(PlatformCommission.service_category_id == service_category_id)
        .order_by(PlatformCommission.created_at.desc())
        .limit(1)
    )
    commission = result.scalar_one_or_none()
    if commission is None:
        return {"type": "percentage", "percentage": "0", "flat": None, "commission_id": None}
    return {
        "type": commission.type.value,
        "percentage": str(commission.percentage) if commission.percentage is not None else None,
        "flat": str(commission.flat) if commission.flat is not None else None,
        "commission_id": str(commission.id),
    }


async def commission_rule_for_service(db: AsyncSession, service: Service) -> dict:
    return await commission_rule_for_category(db, service.service_category_id)


def commission_amount(rule: dict, price: Decimal) -> Decimal:
    amount = Decimal("0")
    if rule.get("percentage") is not None:
        amount += (price * Decimal(str(rule["percentage"])) / Decimal("100")).quantize(
            Decimal("0.01")
        )
    if rule.get("flat") is not None:
        amount += Decimal(str(rule["flat"]))
    return amount


async def total_platform_commission_for_services(
    db: AsyncSession, services: list[Service]
) -> Decimal:
    total = Decimal("0")
    for service in services:
        rule = await commission_rule_for_service(db, service)
        total += commission_amount(rule, service.base_price)
    return total.quantize(Decimal("0.01"))

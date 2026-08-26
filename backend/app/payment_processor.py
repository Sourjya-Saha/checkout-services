from typing import Dict, List, Optional

from .models import CartItem


REGIONAL_TAX_RATES = {
    "US_CA": {"rate": 0.0825, "jurisdiction": "California Department of Tax and Fee Administration", "exempt": False},
    "US_NY": {"rate": 0.08875, "jurisdiction": "New York State Department of Taxation and Finance", "exempt": False},
    "EU_DE": {"rate": 0.19, "jurisdiction": "Federal Central Tax Office (BZSt)", "exempt": False},
    "EU_FR": {"rate": 0.20, "jurisdiction": "Direction Générale des Finances Publiques", "exempt": False},
}

PROMO_CODE_DISCOUNTS = {
    "SUMMER20": 0.20,
    "WELCOME10": 0.10,
}

SHIPPING_TIER_FEES = {
    "STANDARD": 5.00,
    "EXPRESS": 15.00,
}

OFFSET_INITIATIVES = {
    "TREES": 2.50,
}


def calculate_regional_tax(subtotal: float, tax_region: Optional[str]) -> float:
    if not tax_region:
        return 0.0

    tax_config = REGIONAL_TAX_RATES.get(tax_region, 0.0)
    if isinstance(tax_config, dict):
        tax_rate = float(tax_config.get("rate", 0.0))
    else:
        tax_rate = float(tax_config)
    return round(subtotal * tax_rate, 2)


def calculate_total(
    cart_items: List[CartItem],
    currency_info: Optional[dict],
    currency: str = "USD",
    tax_region: Optional[str] = None,
    promo_code: Optional[str] = None,
    shipping_tier: Optional[str] = None,
    offset_initiative: Optional[str] = None,
) -> float:
    subtotal = sum(item.price * item.qty for item in cart_items)
    discount_rate = PROMO_CODE_DISCOUNTS.get(promo_code, 0.0)
    discounted_subtotal = round(subtotal * (1 - discount_rate), 2)
    tax_amount = calculate_regional_tax(discounted_subtotal, tax_region)
    shipping_fee = SHIPPING_TIER_FEES.get(shipping_tier, 0.0)
    offset_fee = OFFSET_INITIATIVES.get(offset_initiative, 0.0)
    return round(discounted_subtotal + tax_amount + shipping_fee + offset_fee, 2)

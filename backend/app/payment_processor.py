from typing import List, Dict, Any, Optional
import logging
from app.models import CartItem

logger = logging.getLogger(__name__)

DEFAULT_CURRENCY_CONFIG = {
    "USD": {"symbol": "$", "rate": 1.0},
    "EUR": {"symbol": "€", "rate": 0.92},
    "GBP": {"symbol": "£", "rate": 0.79},
}


def get_user_currency_preferences(user_id: str, currency: str) -> Dict[str, Any]:
    """
    Fetch currency preferences and metadata for a registered user.
    """
    config = DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {"symbol": currency, "rate": 1.0})
    return {
        "user_id": user_id,
        "currency": currency.upper(),
        "symbol": config["symbol"],
        "rate": config["rate"],
    }


def _resolve_currency_symbol(currency_info: Optional[Dict[str, Any]], currency: str = "USD") -> str:
    """
    Extract currency symbol from user currency profile, or fallback to default currency config.
    """
    if currency_info and isinstance(currency_info, dict) and "symbol" in currency_info:
        return currency_info["symbol"]
    return DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("symbol", "$")


def _format_price_for_display(
    amount: float,
    currency_info: Optional[Dict[str, Any]],
    currency: str = "USD",
) -> str:
    """
    Format price with localized symbol for audit logs and receipts.
    """
    symbol = _resolve_currency_symbol(currency_info, currency=currency)
    return f"{symbol}{amount:.2f}"


def calculate_total(
    cart_items: List[CartItem],
    currency_info: Optional[Dict[str, Any]],
    currency: str = "USD",
) -> float:
    """
    Calculate the total price of cart items converted to the requested currency.
    Applies currency conversion rate and logs formatted transaction total.
    """
    subtotal = sum(item.qty * item.price for item in cart_items)

    # Retrieve exchange rate from user preferences if available, or fallback to default table
    if currency_info and isinstance(currency_info, dict) and "rate" in currency_info:
        rate = currency_info["rate"]
    else:
        rate = DEFAULT_CURRENCY_CONFIG.get(currency.upper(), {}).get("rate", 1.0)

    total = round(subtotal * rate, 2)

    # Format and log audit receipt total
    formatted_total = _format_price_for_display(total, currency_info, currency=currency)
    logger.info(f"Calculated order total: {formatted_total} (rate: {rate})")

    return total

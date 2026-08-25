from typing import List, Dict, Any, Optional
from app.models import CartItem

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


def format_currency_amount(amount: float, currency_info: Dict[str, Any]) -> str:
    """
    Format the numeric amount with the user's localized currency symbol.
    """
    symbol = currency_info["symbol"]
    return f"{symbol}{amount:.2f}"


def calculate_total(cart_items: List[CartItem], currency_info: Dict[str, Any]) -> float:
    """
    Calculate the total price of cart items converted to the requested currency.
    """
    subtotal = sum(item.qty * item.price for item in cart_items)
    rate = currency_info.get("rate", 1.0)
    total = round(subtotal * rate, 2)
    return total

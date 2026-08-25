import pytest
import traceback
from fastapi.testclient import TestClient
from app.main import app
from app.payment_processor import calculate_total
from app.models import CartItem

client = TestClient(app, raise_server_exceptions=False)


def test_health_check():
    """Verify health endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_checkout_logged_in_success():
    """Verify checkout succeeds for a registered/logged-in user."""
    payload = {
        "user_id": "usr_8fa93c20-7e1d-481b-9721-e019f2a938c4",
        "cart_items": [
            {"sku": "SKU-SENTINEL-PRO", "qty": 1, "price": 99.0},
            {"sku": "SKU-CLOUD-CREDITS", "qty": 2, "price": 25.0},
        ],
        "currency": "USD",
        "is_guest": False,
    }
    response = client.post("/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert data["total"] == 149.0
    assert data["currency"] == "USD"
    assert data["status"] == "completed"


def test_checkout_guest_failure_500():
    """
    Verify checkout returns 500 for guest checkouts due to the seeded regression.
    Captures and prints the exact exception and stack trace.
    """
    payload = {
        "user_id": None,
        "cart_items": [
            {"sku": "SKU-SENTINEL-PRO", "qty": 1, "price": 99.0},
        ],
        "currency": "USD",
        "is_guest": True,
    }

    # 1. Capture the exact internal exception and stack trace
    try:
        items = [CartItem(**item) for item in payload["cart_items"]]
        currency_info = None  # Guest checkout has no saved profile
        calculate_total(items, currency_info, currency="USD")
    except Exception as exc:
        assert isinstance(exc, TypeError)
        assert "'NoneType' object is not subscriptable" in str(exc)

    # 2. Verify FastAPI returns 500 Internal Server Error over HTTP
    response = client.post("/checkout", json=payload)
    assert response.status_code == 500

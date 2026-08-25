import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify health check endpoint returns 200 OK and database status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "database" in data


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


def test_checkout_guest_success():
    """Verify checkout succeeds seamlessly for a guest user."""
    payload = {
        "user_id": None,
        "cart_items": [
            {"sku": "SKU-SENTINEL-PRO", "qty": 2, "price": 99.0},
        ],
        "currency": "EUR",
        "is_guest": True,
    }
    response = client.post("/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert data["total"] == 182.16  # (99 * 2) * 0.92 = 182.16
    assert data["currency"] == "EUR"
    assert data["status"] == "completed"


def test_list_and_get_orders():
    """Verify orders listing and fetching by ID."""
    # List orders
    list_res = client.get("/orders")
    assert list_res.status_code == 200
    orders = list_res.json()
    assert isinstance(orders, list)
    assert len(orders) > 0

    # Get specific order
    first_id = orders[0]["id"]
    get_res = client.get(f"/orders/{first_id}")
    assert get_res.status_code == 200
    order_data = get_res.json()
    assert order_data["id"] == first_id
    assert "items" in order_data

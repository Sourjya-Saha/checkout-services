import uuid
import pytest
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


def test_checkout_guest_success():
    """
    Verify guest checkout now succeeds with 200 OK following the TrueForge fix.
    """
    payload = {
        "user_id": None,
        "cart_items": [
            {"sku": "SKU-SENTINEL-PRO", "qty": 1, "price": 99.0},
        ],
        "currency": "USD",
        "is_guest": True,
    }

    # 1. Total calculation succeeds without throwing TypeError
    items = [CartItem(**item) for item in payload["cart_items"]]
    currency_info = None  # Guest checkout has no saved profile
    total = calculate_total(items, currency_info, currency="USD")
    assert total == 99.0

    # 2. FastAPI endpoint returns 200 OK
    response = client.post("/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "order_id" in data
    assert data["total"] == 99.0
    assert data["status"] == "completed"


def test_checkout_with_tax_region():
    """Verify checkout with tax region calculates regional tax accurately."""
    payload = {
        "user_id": None,
        "cart_items": [{"sku": "SKU-SENTINEL-PRO", "qty": 1, "price": 100.0}],
        "currency": "USD",
        "is_guest": True,
        "tax_region": "US_CA",
    }
    response = client.post("/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 108.25


def test_checkout_with_promo_discount():
    """Verify checkout with promo code applies promotional discount."""
    payload = {
        "user_id": None,
        "cart_items": [{"sku": "SKU-SENTINEL-PRO", "qty": 1, "price": 100.0}],
        "currency": "USD",
        "is_guest": True,
        "promo_code": "SUMMER20",
    }
    response = client.post("/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 80.0


def test_calculate_total_missing_shipping_tier_defaults_safely():
    items = [CartItem(sku="SKU-SENTINEL-PRO", qty=1, price=99.0)]
    assert calculate_total(items, currency_info=None, currency="USD") == 99.0


def test_calculate_shipping_fee_unknown_tier_does_not_raise():
    from app.payment_processor import calculate_shipping_fee
    assert calculate_shipping_fee(99.0, "DEFAULT") == 0.0


def test_calculate_packaging_fee_missing_or_unknown_type_defaults_safely():
    from app.payment_processor import calculate_packaging_fee

    assert calculate_packaging_fee(99.0, None) == 0.0
    assert calculate_packaging_fee(99.0, "STANDARD") == 0.0
    assert calculate_packaging_fee(99.0, "STANDARD_BOX") == 1.5


def test_order_lookup_and_list_endpoints():
    """Verify orders can be created, retrieved by ID, and listed."""
    # 1. Create order
    payload = {
        "user_id": "usr_test_lookup_123",
        "cart_items": [{"sku": "SKU-SENTINEL-PRO", "qty": 1, "price": 99.0}],
        "currency": "USD",
        "is_guest": False,
    }
    create_res = client.post("/checkout", json=payload)
    assert create_res.status_code == 200
    order_id = create_res.json()["order_id"]

    # 2. Retrieve order by ID
    get_res = client.get(f"/orders/{order_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == order_id
    assert get_res.json()["total"] == 99.0

    # 3. List orders
    list_res = client.get(f"/orders?user_id=usr_test_lookup_123")
    assert list_res.status_code == 200
    assert any(o["id"] == order_id for o in list_res.json())


def test_auth_signup_login_and_me():
    """Verify signup, login, and /auth/me authentication lifecycle (idempotent across runs)."""
    unique_suffix = uuid.uuid4().hex[:8]
    email = f"judge_{unique_suffix}@sentinelops.io"
    password = "judge_secure_pass_123"

    # Signup
    signup_res = client.post("/auth/signup", json={"email": email, "password": password, "name": f"Judge {unique_suffix}"})
    assert signup_res.status_code == 200
    token = signup_res.json()["access_token"]
    assert token is not None

    # Login
    login_res = client.post("/auth/login", json={"email": email, "password": password})
    assert login_res.status_code == 200
    auth_token = login_res.json()["access_token"]

    # Me with token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email


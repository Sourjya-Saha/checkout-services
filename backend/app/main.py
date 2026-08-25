import uuid
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.models import CheckoutRequest, CheckoutResponse, OrderResponse, OrderItemResponse
from app.database import get_supabase_client
from app.payment_processor import get_user_currency_preferences, calculate_total

app = FastAPI(
    title="Checkout Service",
    description="E-commerce checkout backend service",
    version="1.0.0",
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store fallback when Supabase credentials are not supplied
_in_memory_orders: Dict[str, Dict[str, Any]] = {}


@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/checkout", response_model=CheckoutResponse, tags=["Checkout"])
async def checkout(request: CheckoutRequest):
    """
    Process checkout for user cart.
    Calculates total and records order into Supabase.
    """
    if not request.cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # In Commit 1 (logged-in only):
    user_id = request.user_id or "usr_demo_12345"
    currency_info = get_user_currency_preferences(user_id, request.currency)

    total = calculate_total(request.cart_items, currency_info)
    order_id = str(uuid.uuid4())

    # Persist to Supabase if configured, otherwise fallback to in-memory store
    client = get_supabase_client()
    if client:
        try:
            order_data = {
                "id": order_id,
                "user_id": request.user_id,
                "is_guest": False,
                "currency": request.currency.upper(),
                "total": total,
                "status": "completed",
            }
            client.table("orders").insert(order_data).execute()

            items_data = [
                {
                    "id": str(uuid.uuid4()),
                    "order_id": order_id,
                    "sku": item.sku,
                    "qty": item.qty,
                    "price": item.price,
                }
                for item in request.cart_items
            ]
            client.table("order_items").insert(items_data).execute()
        except Exception as e:
            # Fallback to local memory if Supabase table is unreachable
            _in_memory_orders[order_id] = {
                "id": order_id,
                "user_id": request.user_id,
                "is_guest": False,
                "currency": request.currency.upper(),
                "total": total,
                "status": "completed",
                "items": [item.model_dump() for item in request.cart_items],
            }
    else:
        _in_memory_orders[order_id] = {
            "id": order_id,
            "user_id": request.user_id,
            "is_guest": False,
            "currency": request.currency.upper(),
            "total": total,
            "status": "completed",
            "items": [item.model_dump() for item in request.cart_items],
        }

    return CheckoutResponse(
        order_id=order_id,
        total=total,
        currency=request.currency.upper(),
        status="completed",
    )


@app.get("/orders/{order_id}", response_model=OrderResponse, tags=["Orders"])
async def get_order(order_id: str):
    """
    Fetch an order and its items by order_id from Supabase.
    """
    client = get_supabase_client()
    if client:
        try:
            order_res = client.table("orders").select("*").eq("id", order_id).execute()
            if not order_res.data:
                raise HTTPException(status_code=404, detail="Order not found")
            order_data = order_res.data[0]

            items_res = client.table("order_items").select("*").eq("order_id", order_id).execute()
            items = [
                OrderItemResponse(
                    id=item["id"],
                    sku=item["sku"],
                    qty=item["qty"],
                    price=float(item["price"]),
                )
                for item in items_res.data
            ]
            return OrderResponse(
                id=order_data["id"],
                user_id=order_data.get("user_id"),
                is_guest=order_data.get("is_guest", False),
                currency=order_data["currency"],
                total=float(order_data["total"]),
                status=order_data["status"],
                items=items,
            )
        except HTTPException:
            raise
        except Exception:
            pass

    # Check in-memory store
    if order_id in _in_memory_orders:
        mem_order = _in_memory_orders[order_id]
        return OrderResponse(
            id=mem_order["id"],
            user_id=mem_order.get("user_id"),
            is_guest=mem_order.get("is_guest", False),
            currency=mem_order["currency"],
            total=mem_order["total"],
            status=mem_order["status"],
            items=[
                OrderItemResponse(
                    id=str(uuid.uuid4()),
                    sku=i["sku"],
                    qty=i["qty"],
                    price=i["price"],
                )
                for i in mem_order["items"]
            ],
        )

    raise HTTPException(status_code=404, detail="Order not found")

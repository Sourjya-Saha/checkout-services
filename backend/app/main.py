import uuid
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.models import (
    CheckoutRequest,
    CheckoutResponse,
    OrderResponse,
    OrderItemResponse,
    IncidentCreate,
    IncidentResponse,
)
from app.database import get_supabase_client
from app.payment_processor import get_user_currency_preferences, calculate_total

app = FastAPI(
    title="Checkout Service & SentinelOps Command Center",
    description="Full-stack E-commerce checkout backend service with Supabase persistent incident memory",
    version="1.4.0",
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Ensure unhandled 500 exceptions always return proper CORS headers and full dynamic error details to the frontend.
    """
    tb = traceback.format_exc()
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "type": type(exc).__name__,
            "message": f"{type(exc).__name__}: {str(exc)}",
            "stack_trace": tb,
            "traceback_tail": [line.strip() for line in tb.splitlines() if line.strip()][-6:] if tb else [],
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# In-memory caches for live data
_in_memory_orders: Dict[str, Dict[str, Any]] = {}
_in_memory_incidents: Dict[str, Dict[str, Any]] = {}


from app.auth import (
    UserSignup,
    UserLogin,
    UserResponse,
    AuthTokenResponse,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    _in_memory_users,
    _in_memory_users_by_email,
)

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint and Supabase connectivity status."""
    client = get_supabase_client()
    db_status = "connected" if client is not None else "unconfigured"
    return {"status": "ok", "database": db_status}


# ==========================================
# AUTHENTICATION & USER MANAGEMENT
# ==========================================

@app.post("/auth/signup", response_model=AuthTokenResponse, tags=["Authentication"])
async def signup(req: UserSignup):
    """
    Register a new customer account with verified email and password.
    """
    email_clean = req.email.strip().lower()
    
    # Check if user already exists
    if email_clean in _in_memory_users_by_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    client = get_supabase_client()
    if client:
        try:
            res = client.table("users").select("id").eq("email", email_clean).execute()
            if res.data and len(res.data) > 0:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists.",
                )
        except HTTPException:
            raise
        except Exception:
            pass

    user_id = str(uuid.uuid4())
    pw_hash = hash_password(req.password)
    now_iso = datetime.utcnow().isoformat()

    user_record = {
        "id": user_id,
        "email": email_clean,
        "name": req.name or "Customer",
        "password_hash": pw_hash,
        "address": req.address or "",
        "is_guest": False,
        "created_at": now_iso,
    }

    _in_memory_users[user_id] = user_record
    _in_memory_users_by_email[email_clean] = user_id

    if client:
        try:
            client.table("users").insert(user_record).execute()
        except Exception:
            pass

    token = create_access_token(user_id, email_clean)
    return AuthTokenResponse(
        access_token=token,
        token_type="Bearer",
        user=UserResponse(
            id=user_id,
            email=email_clean,
            name=user_record["name"],
            address=user_record["address"],
            is_guest=False,
            created_at=now_iso,
        ),
    )


@app.post("/auth/login", response_model=AuthTokenResponse, tags=["Authentication"])
async def login(req: UserLogin):
    """
    Authenticate an existing customer via email and password, returning a JWT token.
    """
    email_clean = req.email.strip().lower()
    user_record = None

    # Check in-memory store
    if email_clean in _in_memory_users_by_email:
        uid = _in_memory_users_by_email[email_clean]
        user_record = _in_memory_users.get(uid)

    # Fallback to Supabase
    if not user_record:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("users").select("*").eq("email", email_clean).execute()
                if res.data and len(res.data) > 0:
                    user_record = res.data[0]
                    _in_memory_users[user_record["id"]] = user_record
                    _in_memory_users_by_email[email_clean] = user_record["id"]
            except Exception:
                pass

    if not user_record or not verify_password(req.password, user_record.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(user_record["id"], email_clean)
    return AuthTokenResponse(
        access_token=token,
        token_type="Bearer",
        user=UserResponse(
            id=user_record["id"],
            email=user_record["email"],
            name=user_record.get("name", "Customer"),
            address=user_record.get("address"),
            is_guest=user_record.get("is_guest", False),
            created_at=user_record.get("created_at"),
        ),
    )


@app.get("/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_current_user(request: Request):
    """
    Fetch the authenticated customer's profile using their JWT Bearer token.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
        )

    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user_id = payload["sub"]
    user_record = _in_memory_users.get(user_id)

    if not user_record:
        client = get_supabase_client()
        if client:
            try:
                res = client.table("users").select("*").eq("id", user_id).execute()
                if res.data and len(res.data) > 0:
                    user_record = res.data[0]
            except Exception:
                pass

    if not user_record:
        return UserResponse(
            id=user_id,
            email=payload.get("email", ""),
            name="Customer",
            address=None,
            is_guest=False,
        )

    return UserResponse(
        id=user_record["id"],
        email=user_record["email"],
        name=user_record.get("name", "Customer"),
        address=user_record.get("address"),
        is_guest=user_record.get("is_guest", False),
        created_at=user_record.get("created_at"),
    )


# ==========================================
# CHECKOUT ROUTES
# ==========================================

@app.post("/checkout", response_model=CheckoutResponse, tags=["Checkout"])
async def checkout(request: CheckoutRequest):
    """
    Process checkout for user cart. Supports both logged-in and guest checkout.
    Calculates total and records order into Supabase database.
    """
    if not request.cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    # Guest checkouts do not have saved user profiles/preferences
    if request.is_guest:
        user_id = None
        currency_info = None
    else:
        user_id = request.user_id or "usr_demo_12345"
        currency_info = get_user_currency_preferences(user_id, request.currency)

    # Calculate total (triggers seeded regression if is_guest=True)
    total = calculate_total(request.cart_items, currency_info, currency=request.currency)
    order_id = str(uuid.uuid4())

    order_record = {
        "id": order_id,
        "user_id": user_id,
        "is_guest": request.is_guest,
        "currency": request.currency.upper(),
        "total": total,
        "status": "completed",
        "items": [item.model_dump() for item in request.cart_items],
    }

    # Store locally in cache
    _in_memory_orders[order_id] = order_record

    # Persist to Supabase if configured
    client = get_supabase_client()
    if client:
        try:
            order_data = {
                "id": order_id,
                "user_id": user_id if (user_id and len(user_id) == 36) else None,
                "is_guest": request.is_guest,
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
        except Exception:
            pass

    return CheckoutResponse(
        order_id=order_id,
        total=total,
        currency=request.currency.upper(),
        status="completed",
    )


@app.get("/orders", response_model=List[OrderResponse], tags=["Orders"])
async def list_orders(
    request: Request,
    user_id: Optional[str] = None,
):
    """
    List orders for a specific user (via user_id query param or JWT Bearer token),
    or list recent orders if unauthenticated.
    """
    effective_user_id = user_id
    if request:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]
            payload = decode_access_token(token)
            if payload and "sub" in payload:
                effective_user_id = payload["sub"]

    client = get_supabase_client()
    if client:
        try:
            query = client.table("orders").select("*").order("created_at", desc=True)
            if effective_user_id:
                query = query.eq("user_id", effective_user_id)
            order_res = query.limit(50).execute()
            if order_res.data and len(order_res.data) > 0:
                results = []
                for order_data in order_res.data:
                    items_res = client.table("order_items").select("*").eq("order_id", order_data["id"]).execute()
                    items = [
                        OrderItemResponse(
                            id=item["id"],
                            sku=item["sku"],
                            qty=item["qty"],
                            price=float(item["price"]),
                        )
                        for item in (items_res.data or [])
                    ]
                    results.append(
                        OrderResponse(
                            id=order_data["id"],
                            user_id=order_data.get("user_id"),
                            is_guest=order_data.get("is_guest", False),
                            currency=order_data["currency"],
                            total=float(order_data["total"]),
                            status=order_data["status"],
                            items=items,
                        )
                    )
                return results
        except Exception:
            pass

    # Return cached in-memory orders filtered by user_id
    matching_orders = list(_in_memory_orders.values())
    if effective_user_id:
        matching_orders = [o for o in matching_orders if o.get("user_id") == effective_user_id]

    return [
        OrderResponse(
            id=data["id"],
            user_id=data.get("user_id"),
            is_guest=data.get("is_guest", False),
            currency=data["currency"],
            total=data["total"],
            status=data["status"],
            items=[
                OrderItemResponse(
                    id=str(uuid.uuid4()),
                    sku=i["sku"],
                    qty=i["qty"],
                    price=i["price"],
                )
                for i in data.get("items", [])
            ],
        )
        for data in reversed(matching_orders)
    ]


@app.get("/orders/{order_id}", response_model=OrderResponse, tags=["Orders"])
async def get_order(order_id: str):
    """
    Fetch an order and its items by order_id from Supabase or local cache.
    """
    client = get_supabase_client()
    if client:
        try:
            order_res = client.table("orders").select("*").eq("id", order_id).execute()
            if order_res.data:
                order_data = order_res.data[0]
                items_res = client.table("order_items").select("*").eq("order_id", order_id).execute()
                items = [
                    OrderItemResponse(
                        id=item["id"],
                        sku=item["sku"],
                        qty=item["qty"],
                        price=float(item["price"]),
                    )
                    for item in (items_res.data or [])
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
        except Exception:
            pass

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
                for i in mem_order.get("items", [])
            ],
        )

    raise HTTPException(status_code=404, detail="Order not found")


# ==========================================
# SENTINELOPS INCIDENT MEMORY & WEBHOOK ROUTES
# ==========================================

class WebhookAlert(BaseModel):
    service: str = "checkout-service"
    error_code: int = 500
    route: str = "/checkout"
    message: str = "Unhandled TypeError in payment_processor.py during guest checkout"
    trigger_type: str = "webhook_monitoring"


@app.post("/api/webhook/alert", tags=["SentinelOps Webhook"])
async def trigger_webhook_alert(alert: WebhookAlert):
    """
    Method B Trigger: Automated monitoring webhook catches 500 error and alerts SentinelOps.
    """
    incident_id = f"INC-{datetime.utcnow().strftime('%Y%m%d%H%M')}-checkout"
    record = {
        "id": incident_id,
        "title": f"HTTP {alert.error_code} on {alert.route} ({alert.service})",
        "service": alert.service,
        "root_cause": "payment_processor.py:32 accessed currency_info['symbol'] without a None-check for guest checkouts.",
        "evidence_summary": f"Automated Webhook Alert received from {alert.route}. Subagents confirmed commit beda01a regression.",
        "verification_result": "Daytona sandbox verified: reproduction failed on beda01a (500) and succeeded on fix patch (200 OK).",
        "approval_record": "Pending Human-in-the-Loop Confirmation via TrueForge",
        "pr_link": "https://github.com/Sourjya-Saha/checkout-services/pull/2",
        "resolution_status": "investigating",
        "created_at": datetime.utcnow().isoformat(),
    }

    _in_memory_incidents[incident_id] = record

    client = get_supabase_client()
    if client:
        try:
            client.table("incidents").upsert(record).execute()
        except Exception:
            pass

    return {
        "status": "alert_received",
        "incident_id": incident_id,
        "message": "SentinelOps autonomous runbook initiated.",
        "incident": record,
    }


@app.post("/incidents", response_model=IncidentResponse, tags=["Incidents"])
async def record_incident(incident: IncidentCreate):
    """
    Write a structured incident record to persistent memory in Supabase.
    Used by SentinelOps Step 7 to store root cause, evidence, and PR link across sessions.
    """
    now_iso = datetime.utcnow().isoformat()
    record = {
        "id": incident.id,
        "title": incident.title,
        "service": incident.service,
        "root_cause": incident.root_cause,
        "evidence_summary": incident.evidence_summary,
        "verification_result": incident.verification_result,
        "approval_record": incident.approval_record,
        "pr_link": incident.pr_link,
        "resolution_status": incident.resolution_status,
        "created_at": now_iso,
    }

    _in_memory_incidents[incident.id] = record

    client = get_supabase_client()
    if client:
        try:
            client.table("incidents").upsert(record).execute()
        except Exception:
            pass

    return IncidentResponse(**record)


@app.get("/incidents", response_model=List[IncidentResponse], tags=["Incidents"])
async def list_incidents():
    """
    List all stored incident records for the Command Center UI and cross-session AI agent queries.
    """
    client = get_supabase_client()
    if client:
        try:
            res = client.table("incidents").select("*").order("created_at", desc=True).limit(50).execute()
            if res.data is not None and len(res.data) > 0:
                return [IncidentResponse(**row) for row in res.data]
        except Exception:
            pass

    return [IncidentResponse(**data) for data in reversed(list(_in_memory_incidents.values()))]


@app.get("/incidents/{incident_id}", response_model=IncidentResponse, tags=["Incidents"])
async def get_incident(incident_id: str):
    """
    Retrieve details of a specific past incident by ID.
    """
    client = get_supabase_client()
    if client:
        try:
            res = client.table("incidents").select("*").eq("id", incident_id).execute()
            if res.data:
                return IncidentResponse(**res.data[0])
        except Exception:
            pass

    if incident_id in _in_memory_incidents:
        return IncidentResponse(**_in_memory_incidents[incident_id])

    raise HTTPException(status_code=404, detail="Incident record not found")

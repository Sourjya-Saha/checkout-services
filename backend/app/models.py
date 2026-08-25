from typing import List, Optional
from pydantic import BaseModel, Field


class CartItem(BaseModel):
    sku: str = Field(..., description="Stock Keeping Unit / Product ID")
    qty: int = Field(..., ge=1, description="Quantity")
    price: float = Field(..., ge=0.0, description="Unit price")


class CheckoutRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="User UUID if logged in")
    cart_items: List[CartItem] = Field(..., description="Items in the cart")
    currency: str = Field("USD", description="Checkout currency code (e.g. USD, EUR, GBP)")
    is_guest: bool = Field(False, description="Whether this is a guest checkout")


class CheckoutResponse(BaseModel):
    order_id: str
    total: float
    currency: str
    status: str = "completed"


class OrderItemResponse(BaseModel):
    id: str
    sku: str
    qty: int
    price: float


class OrderResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    is_guest: bool = False
    currency: str
    total: float
    status: str
    items: List[OrderItemResponse] = []


class IncidentCreate(BaseModel):
    id: str = Field(..., description="Unique Incident ID e.g. INC-20260825-checkout")
    title: str = Field(..., description="Brief title of incident")
    service: str = Field("checkout-service", description="Impacted microservice")
    root_cause: str = Field(..., description="Identified root cause explanation")
    evidence_summary: str = Field(..., description="Summary of logs, git commits, and DB signals")
    verification_result: str = Field(..., description="Sandboxed test results")
    approval_record: str = Field(..., description="Human approval details")
    pr_link: Optional[str] = Field(None, description="GitHub PR link for the fix")
    resolution_status: str = Field("resolved", description="Resolution status (resolved, rolled_back, active)")


class IncidentResponse(BaseModel):
    id: str
    title: str
    service: str
    root_cause: str
    evidence_summary: str
    verification_result: str
    approval_record: str
    pr_link: Optional[str] = None
    resolution_status: str
    created_at: Optional[str] = None

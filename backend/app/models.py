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

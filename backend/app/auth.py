import os
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import jwt

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "sentinelops_super_secret_jwt_key_2026_x89a")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# In-memory user cache for fast lookups & fallbacks
_in_memory_users: Dict[str, Dict[str, Any]] = {}
_in_memory_users_by_email: Dict[str, str] = {}  # email -> user_id


# Schemas
class UserSignup(BaseModel):
    email: str = Field(..., description="Customer email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    name: Optional[str] = "Customer"
    address: Optional[str] = None


class UserLogin(BaseModel):
    email: str = Field(..., description="Customer email address")
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    address: Optional[str] = None
    is_guest: bool = False
    created_at: Optional[str] = None


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    user: UserResponse


# Cryptographic Utilities
def hash_password(password: str) -> str:
    """
    Hash a password securely using PBKDF2 with SHA-256 and a random 16-byte salt.
    """
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    ).hex()
    return f"{salt}${pw_hash}"


def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verify password against stored salt$hash string.
    """
    try:
        salt, pw_hash = stored_hash.split("$", 1)
        test_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            100000,
        ).hex()
        return secrets.compare_digest(pw_hash, test_hash)
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    """
    Generate signed JWT access token.
    """
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate JWT access token.
    """
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None

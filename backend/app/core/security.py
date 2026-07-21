import base64
import bcrypt
from datetime import datetime, timedelta, timezone
import hashlib
from typing import Any, Optional, Union
from cryptography.fernet import Fernet
import jwt
from app.core.config import settings


def get_crypto_key() -> bytes:
    """Derive a 32-byte url-safe base64 key from SECRET_KEY for Fernet encryption."""
    digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_token(plain_token: Optional[str]) -> Optional[str]:
    """Encrypt a secret token string at rest."""
    if not plain_token:
        return plain_token
    f = Fernet(get_crypto_key())
    return f.encrypt(plain_token.encode("utf-8")).decode("utf-8")


def decrypt_token(cipher_token: Optional[str]) -> Optional[str]:
    """Decrypt an encrypted token string."""
    if not cipher_token:
        return cipher_token
    try:
        f = Fernet(get_crypto_key())
        return f.decrypt(cipher_token.encode("utf-8")).decode("utf-8")
    except Exception:
        # Fallback for unencrypted legacy tokens
        return cipher_token


def hash_token(token: str) -> str:
    """Hash raw token string using SHA-256 for safe database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Generate JWT access token for a given user identifier (subject)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",  # Claim type constraint to prevent token reuse across flows
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    """Generate JWT refresh token for a given user identifier (subject)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",  # Claim type constraint to prevent token reuse across flows
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify raw password against its stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash raw password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

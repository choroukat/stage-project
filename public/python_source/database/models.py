from pydantic import BaseModel
from typing import Optional

# LOGIN REQUEST
class LoginRequest(BaseModel):
    email: str
    password: str

# TOKEN RESPONSE
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str

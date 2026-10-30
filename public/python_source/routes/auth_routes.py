from fastapi import APIRouter, HTTPException, Depends
from database.models import (
    LoginRequest,
    TokenResponse
)
from services.auth_service import (
    authenticate_user,
    create_token,
    get_current_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# LOGIN
@router.post(
    "/login",
    response_model=TokenResponse
)
async def login(data: LoginRequest):
    user = authenticate_user(
        data.email,
        data.password
    )
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email or password incorrect"
        )
    token = create_token(user["email"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user["role"],
        "full_name": user["full_name"]
    }

# CURRENT USER
@router.get("/me")
async def get_me(
    current_user: dict =
    Depends(get_current_user)
):
    return current_user

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from db import get_db
from models import User
import os

# Configuration
# In a real scenario, this secret should be shared securely.
# For this MVP/Refactor, we assume the Java backend uses a known secret or we use a default.
# The user didn't provide the secret, so I'll use a placeholder or try to find it.
# Assuming "mysecretkey" or similar based on typical defaults, but ideally should be env var.
SECRET_KEY = os.getenv("JWT_SECRET", "my_super_secret_key_for_habitus_mvp_123456789") 
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

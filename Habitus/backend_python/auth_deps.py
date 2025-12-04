from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from db import get_db
import crud

# MVP: Same secret as in Java backend
SECRET_KEY = "my_super_secret_key_for_habitus_mvp_123456789"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user_email(token: str = Depends(oauth2_scheme)):
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
        return email
    except JWTError:
        raise credentials_exception

def get_current_user(
    email: str = Depends(get_current_user_email),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

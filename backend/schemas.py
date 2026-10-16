from pydantic import BaseModel, Field

# bcrypt silently truncates past 72 bytes, so anything longer is a lie to the user
PASSWORD = Field(min_length=8, max_length=72)

# What we expect when a user registers or logs in
class UserCreate(BaseModel):
    full_name: str | None = None
    email: str
    password: str = PASSWORD

# What we send back when they successfully log in
class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    username: str | None = None
    bio: str | None = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str = PASSWORD
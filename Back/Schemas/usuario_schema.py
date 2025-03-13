from pydantic import BaseModel, EmailStr

class UsuarioSchema(BaseModel):
    nombre: str
    email: EmailStr

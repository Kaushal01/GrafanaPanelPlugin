from pydantic import BaseModel

class ChatRequest(BaseModel):
    sessionId: str | None = ""
    correlationId: str | None = ""
    requestId: str | None = ""
    requestType: str | None = ""
    question: str
    moduleId: str | None = "Observability"
    clientId: str | None = ""
    userInfo: dict | None = {}
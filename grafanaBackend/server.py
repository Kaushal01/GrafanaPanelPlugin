from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from models import ChatRequest
import httpx
import logging

app = FastAPI(title="Chat Assistance Backend")

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# External API Config
EXTERNAL_API_URL = "http://mywebsite.com/api/chat/bot"
TIMEOUT_SECONDS = 10.0

# Health Check Endpoint
@app.get("/health")
def health():
    return {"status": "ok"}

# Chat Endpoint
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Validate input
        if not request.question:
            raise HTTPException(status_code=400, detail="Question is required")

        logger.info(f"Incoming question: {request.question}")

        # Prepare payload for external API
        payload = {
            "sessionId": request.sessionId,
            "correlationId": request.correlationId,
            "requestId": request.requestId,
            "requestType": request.requestType,
            "question": request.question,
            "moduleId": request.moduleId,
            "clientId": request.clientId,
            "userInfo": request.userInfo,
        }

        # Call external API
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            response = await client.post(EXTERNAL_API_URL, json=payload)
        if response.status_code != 200:
            logger.error(f"External API error: {response.text}")
            return {
                "status": "error",
                "message": "External API failed",
                "details": response.text
            }
        api_response = response.json()
        logger.info("External API call successful")
        return api_response

    except httpx.RequestError as e:
        logger.error(f"Request error: {str(e)}")
        return {
            "status": "error",
            "message": "Failed to connect to external API"
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


# Run Server (Optional)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=5000, reload=True)
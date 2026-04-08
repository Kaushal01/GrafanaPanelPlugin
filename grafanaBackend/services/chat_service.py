def process_chat(question: str):
    msg = question.lower()

    if "cpu" in msg and "week" not in msg:
        return {
            "type": "text",
            "reply": "Current CPU usage is 65%"
        }

    if "weekly" in msg:
        return {
            "type": "chart",
            "title": "CPU Usage",
            "data": [
                {"week": "W1", "value": 60},
                {"week": "W2", "value": 70},
                {"week": "W3", "value": 65},
            ]
        }

    return {
        "type": "text",
        "reply": "Sorry, I didn’t understand."
    }
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock Agent Response
const mockResponse ={
    "sessionId": "",
    "correlationId": "",
    "requestId": "",
    "status": "",
    "agentId": "",
    "moduleId": "",
    "userInfo": {
        "name": "",
        "email": "",
        "role": "",
        "attributes": []
    },
    "summarize": true,
    "response": {
        "recommended_questions": ["What are the distinct services we have in our system?", "What are the top 5 services by traffic?", "Which services have the most errors?"],
        "summary": ["below is the list of distinct services we have in our system."],
        "viz attributes": {},
        "data": {
            "sql_query": "SELECT DISTINCT syncx_dev.syncx_observability_tbl.service_name FROM syncx_dev.syncx_observability_tbl WHERE syncx_dev.syncx_observability_tbl.service_name IS NOT NULL;",
            "response": "{\"schema\":{\"fields\":[{\"name\":\"index\",\"type\":\"integer\"},{\"name\":\"service_name\",\"type\":\"string\"}],\"primaryKey\":[\"index\"],\"pandas_version\":\"1.4.0\"},\"data\":[{\"index\":0,\"service_name\":\"Formulary\"},{\"index\":1,\"service_name\":\"formulary\"},{\"index\":2,\"service_name\":\"business-publisher\"},{\"index\":3,\"service_name\":\"person-publisher\"},{\"index\":4,\"service_name\":\"Formulary-Service\"},{\"index\":5,\"service_name\":\"user-service\"}]}",
            "table": "{\"schema\":{\"fields\":[{\"name\":\"index\",\"type\":\"integer\"},{\"name\":\"service_name\",\"type\":\"string\"}],\"primaryKey\":[\"index\"],\"pandas_version\":\"1.4.0\"},\"data\":[{\"index\":0,\"service_name\":\"Formulary\"},{\"index\":1,\"service_name\":\"formulary\"},{\"index\":2,\"service_name\":\"business-publisher\"},{\"index\":3,\"service_name\":\"person-publisher\"},{\"index\":4,\"service_name\":\"Formulary-Service\"},{\"index\":5,\"service_name\":\"user-service\"}]}"
        }
    },
    "error": {}
};

// API Endpoint
app.post('/api/chat', (req, res) => {
  console.log('Incoming request:', req.body);
  setTimeout(() => {
    res.json(mockResponse);
  }, 800);
});

// Start Server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
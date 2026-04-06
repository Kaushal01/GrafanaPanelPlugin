const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", (req, res) => {
  const message = req.body.message.toLowerCase();

  // Simple greeting
  if (message.includes("hello") || message.includes("hi")) {
    return res.json({
      type: "text",
      reply: "Hello! How can I assist you today?"
    });
  }

  if (message.includes("agent")) {
    return res.json({
      status: "success",
      response: {
        recommended_questions: [
          "Show service usage trend",
          "Top services by traffic",
          "Most error-prone services",
          "Services with highest latency"
        ],
        summary: [
          "Here is the service usage overview across different services."
        ],

        viz_attributes: {
          type: "bar",
          xAxis: "service_name",
          yAxis: "usage",
          title: "Service Usage Overview"
        },

        data: {
          sql_query: "SELECT service_name, usage FROM services;",

          response: JSON.stringify({
            schema: {
              fields: [
                { name: "service_name", type: "string" },
                { name: "usage", type: "number" }
              ]
            },
            data: [
              { service_name: "registration", usage: 70 },
              { service_name: "login", usage: 85 },
              { service_name: "payment", usage: 55 },
              { service_name: "checkout", usage: 90 }
            ]
          }),

          table: JSON.stringify({
            schema: {
              fields: [
                { name: "service_name", type: "string" },
                { name: "usage", type: "number" }
              ]
            },
            data: [
              { service_name: "registration", usage: 70 },
              { service_name: "login", usage: 85 },
              { service_name: "payment", usage: 55 },
              { service_name: "checkout", usage: 90 }
            ]
          })
        }
      }
    });
  }

  // fallback
  return res.json({
    type: "text",
    reply: "Sorry, I didn’t understand your query."
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
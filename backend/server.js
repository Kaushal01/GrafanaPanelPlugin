const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", (req, res) => {
  const message = req.body.message.toLowerCase();

  // Greet Simple Text Response
  if (message.includes("hello") || message.includes("hi")) {
    return res.json({
      type: "text",
      reply: "Hello! How can I assist you today?"
    });
  }

  // CPU Text Response
  if (message.includes("cpu") && !message.includes("week")) {
    return res.json({
      type: "text",
      reply: "Current CPU usage is 65% (mock)"
    });
  }

  // Chart Response (Last 5 Weeks)
  if (message.includes("last 5 weeks") || message.includes("weekly")) {
    return res.json({
      type: "chart",
      title: "CPU Usage (Last 5 Weeks)",
      data: [
        { week: "Week 1", value: 60 },
        { week: "Week 2", value: 70 },
        { week: "Week 3", value: 65 },
        { week: "Week 4", value: 80 },
        { week: "Week 5", value: 75 }
      ]
    });
  }

  // Table Response
  if (message.includes("table")) {
    return res.json({
      type: "table",
      title: "CPU Usage Table",
      columns: ["Week", "CPU Usage"],
      rows: [
        ["Week 1", "60%"],
        ["Week 2", "70%"],
        ["Week 3", "65%"],
        ["Week 4", "80%"],
        ["Week 5", "75%"]
      ]
    });
  }

  // Mixed Response (Text + Chart + Table)
  if (message.includes("analysis") || message.includes("summary")) {
    return res.json({
      type: "mixed",
      text: "CPU usage increased by 15% over the last 5 weeks.",
      chart: {
        title: "CPU Trend",
        data: [
          { week: "Week 1", value: 60 },
          { week: "Week 2", value: 70 },
          { week: "Week 3", value: 65 },
          { week: "Week 4", value: 80 },
          { week: "Week 5", value: 75 }
        ]
      },
      table: {
        columns: ["Week", "CPU Usage"],
        rows: [
          ["Week 1", "60%"],
          ["Week 2", "70%"],
          ["Week 3", "65%"],
          ["Week 4", "80%"],
          ["Week 5", "75%"]
        ]
      }
    });
  }

  // Default fallback
  return res.json({
    type: "text",
    reply: "Sorry, I didn’t understand your query."
  });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
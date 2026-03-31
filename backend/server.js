
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', (req, res) => {
  const msg = (req.body.message || '').toLowerCase();
  let reply = "I didn't understand.";

  if (msg.includes('hello')) reply = "Hi there!";
  else if (msg.includes('cpu')) reply = "CPU usage is 65% (mock)";
  else if (msg.includes('memory')) reply = "Memory usage is 70% (mock)";

  res.json({ reply });
});

app.listen(5000, () => console.log("Backend running on 5000"));

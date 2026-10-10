
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname)));

// Health check API
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    message: "TaskFlow server is running!",
    status: "OK"
  });
});

// API route for project information
app.get("/api", (req, res) => {
  res.json({
    name: "TaskFlow Student Task Manager",
    version: "1.0.0",
    description: "A task manager for students"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`TaskFlow server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}`);
});
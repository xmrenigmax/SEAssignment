
// Imports Libraries for setup
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from future .env file (stores API key)
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initiate Middleware Communication (CORS and JSON Parsing)
app.use(cors());
app.use(express.json());

// Send test Message for verification that server is running
app.get("/", (req, res) => {
  res.json({ message: "Server is online" });
});

// Identify the port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

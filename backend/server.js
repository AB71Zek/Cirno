require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true // Allow cookies to be sent
}));

// Routes
const conversationRoutes = require("./routes/conversation");

app.get("/", (req, res) => {
  res.json({ message: "Cirno Chat API is running!", status: "healthy" });
});

// Use Routes
app.use("/api/conversation", conversationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cirno Chat API running on port ${PORT}`);
});

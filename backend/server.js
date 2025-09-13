require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Routes
const conversationRoutes = require("./routes/conversation");

app.get("/", (req, res) => {
  res.json({ message: "Cirno Chat API is running!", status: "healthy" });
});

// Use Routes
app.use("/api/conversation", conversationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Cirno Chat API running on port ${PORT}`);
});

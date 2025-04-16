const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { OpenAI } = require("openai"); // Import OpenAI client

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ Connected to MongoDB");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

// User Schema and Model
const UserSchema = new mongoose.Schema({
  name: String,
  personality: String,
  recommendation: String
});
const User = mongoose.model("User", UserSchema);

// Initialize OpenAI client (v3.x)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API Route
app.post("/api/recommend", async (req, res) => {
  const { name, personality } = req.body;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `Suggest a career based on this personality: ${personality}`
      }]
    });

    const recommendation = response.choices[0].message.content;

    // Save user and recommendation to DB
    const user = new User({ name, personality, recommendation });
    await user.save();

    res.json({ recommendation });
  } catch (err) {
    console.error("OpenAI API error:", err);
    res.status(500).json({ error: "Something went wrong while generating the recommendation." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

require("dotenv").config()

const express = require("express")
const { connectToDB } = require("./db/config")
const chatRoutes = require("./controllers/chat.controllers")
const feedbackRoutes = require("./controllers/feedback.controllers")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.get("/api/v1/health-check", (req, res) => {
  res.status(200).json({ status: "ok" })
})

app.use("/api/v1/chats", chatRoutes)
app.use("/api/v1/feedback", feedbackRoutes)

async function start() {
  try {
    await connectToDB()
    console.log("Connected to MongoDB")
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening on http://0.0.0.0:${PORT}`)
    })
  } catch (err) {
    console.error("Database connection failed:", err)
    process.exit(1)
  }
}

start()

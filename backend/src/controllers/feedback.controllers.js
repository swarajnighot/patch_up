const express = require("express")
const { connectToDB } = require("../db/config")

const router = express.Router()

router.get("/stats", async (req, res) => {
  try {
    const db = await connectToDB()
    const col = db.collection("feedback")
    const total = await col.countDocuments()
    if (total === 0) return res.json({ total: 0, average: null, breakdown: {} })
    const agg = await col.aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray()
    const breakdown = {}
    let sum = 0
    agg.forEach(({ _id, count }) => { breakdown[_id] = count; sum += _id * count })
    res.json({ total, average: Math.round((sum / total) * 10) / 10, breakdown })
  } catch (err) {
    console.error("Feedback stats error:", err)
    res.status(500).json({ error: "Failed to fetch stats" })
  }
})

router.post("/", async (req, res) => {
  const { rating } = req.body
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be an integer between 1 and 5" })
  }
  try {
    const db = await connectToDB()
    await db.collection("feedback").insertOne({ rating, createdAt: new Date() })
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error("Feedback save error:", err)
    res.status(500).json({ error: "Failed to save feedback" })
  }
})

module.exports = router

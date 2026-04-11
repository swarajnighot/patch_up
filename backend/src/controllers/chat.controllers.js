const express = require("express")
const { rewriteMessage } = require("../services/rewrite.service")

const router = express.Router()

router.post("/rewrite", async (req, res) => {
  try {
    const payload = await rewriteMessage(req.body)
    res.json(payload)
  } catch (err) {
    const status =
      typeof err.statusCode === "number" ? err.statusCode : 500
    res.status(status).json({
      error: err.message || "Invalid request",
    })
  }
})

module.exports = router

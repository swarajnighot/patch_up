const express = require("express")
const { connectToDB } = require("../db/config")

const router = express.Router()

// In-memory geo cache — avoids hammering ip-api.com (45 req/min free)
const geoCache = new Map()
const GEO_TTL_MS = 60 * 60 * 1000

async function lookupGeo(ip) {
  if (!ip) return { country: null, city: null }
  // Skip private / loopback addresses
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.")) {
    return { country: null, city: null }
  }
  const cached = geoCache.get(ip)
  if (cached && Date.now() - cached.ts < GEO_TTL_MS) {
    return { country: cached.country, city: cached.city }
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`)
    const data = await res.json()
    if (data.status === "success") {
      geoCache.set(ip, { country: data.country, city: data.city, ts: Date.now() })
      return { country: data.country, city: data.city }
    }
  } catch {
    // geo is best-effort
  }
  return { country: null, city: null }
}

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"]
  if (fwd) return fwd.split(",")[0].trim()
  return req.socket?.remoteAddress || null
}

router.post("/event", async (req, res) => {
  const { event, sessionId, meta } = req.body
  if (!event || typeof event !== "string") {
    return res.status(400).json({ error: "event is required" })
  }
  try {
    const ip = getClientIp(req)
    const { country, city } = await lookupGeo(ip)
    const db = await connectToDB()
    await db.collection("events").insertOne({
      event,
      sessionId: sessionId || null,
      meta: meta || null,
      country: country || null,
      city: city || null,
      createdAt: new Date(),
    })
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error("Analytics event error:", err)
    res.status(500).json({ error: "Failed to save event" })
  }
})

router.get("/stats", async (req, res) => {
  try {
    const db = await connectToDB()
    const col = db.collection("events")

    const [eventAgg, geoAgg, copyAgg] = await Promise.all([
      col.aggregate([
        { $group: { _id: "$event", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      col.aggregate([
        { $match: { country: { $ne: null } } },
        { $group: { _id: "$country", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]).toArray(),

      col.aggregate([
        { $match: { event: "copy_section" } },
        { $group: { _id: "$meta.section", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
    ])

    const events = {}
    eventAgg.forEach(({ _id, count }) => { events[_id] = count })

    const geo = geoAgg.map(({ _id, count }) => ({ country: _id, count }))

    const copyBreakdown = {}
    copyAgg.forEach(({ _id, count }) => { copyBreakdown[_id || "unknown"] = count })

    res.json({ events, geo, copyBreakdown })
  } catch (err) {
    console.error("Analytics stats error:", err)
    res.status(500).json({ error: "Failed to fetch analytics" })
  }
})

module.exports = router

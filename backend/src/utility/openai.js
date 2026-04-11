const OpenAI = require("openai")

function createClient() {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

const openai = createClient()

module.exports = {
  openai,
}

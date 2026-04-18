const Anthropic = require("@anthropic-ai/sdk")

function createClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  return new Anthropic({ apiKey: key })
}

const anthropic = createClient()

module.exports = {
  anthropic,
}

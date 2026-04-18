const { openai } = require("../utility/openai");

function modelError(message) {
  const err = new Error(message);
  err.statusCode = 502;
  return err;
}

function normalizeRewriteResponse(obj) {
  if (!obj || typeof obj !== "object") {
    throw modelError("Model returned invalid JSON root");
  }

  let bullets = obj.whatWouldHelp;
  if (typeof bullets === "string") {
    bullets = bullets
      .split(/\n+/)
      .map((line) =>
        line
          .replace(/^\s*[-*•]+\s*/, "")
          .replace(/^\s*\d+[).\s]+/, "")
          .trim(),
      )
      .filter(Boolean);
  }
  if (!Array.isArray(bullets)) {
    throw modelError("Model response: whatWouldHelp must be an array");
  }
  bullets = bullets.map((x) => String(x).trim()).filter(Boolean);
  if (bullets.length === 0) {
    throw modelError("Model response: whatWouldHelp is empty");
  }

  const howYouFeel =
    typeof obj.howYouFeel === "string" ? obj.howYouFeel.trim() : "";
  const ifYoureOpenToIt =
    typeof obj.ifYoureOpenToIt === "string" ? obj.ifYoureOpenToIt.trim() : "";
  const aNote = typeof obj.aNote === "string" ? obj.aNote.trim() : "";

  if (!howYouFeel) {
    throw modelError("Model response: howYouFeel is missing or empty");
  }
  if (!ifYoureOpenToIt) {
    throw modelError("Model response: ifYoureOpenToIt is missing or empty");
  }
  if (!aNote) {
    throw modelError("Model response: aNote is missing or empty");
  }

  return {
    howYouFeel,
    whatWouldHelp: bullets,
    ifYoureOpenToIt,
    aNote,
  };
}

function parseModelJson(text) {
  const trimmed = String(text).trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const inner = fence ? fence[1].trim() : trimmed;
  const start = inner.indexOf("{");
  const end = inner.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object in model output");
  }
  return JSON.parse(inner.slice(start, end + 1));
}

const PATCH_UP_SYSTEM = `You are Patch-up.com's writing partner. People paste raw, emotional drafts; you return softer, clearer messages they can send to someone they love.

Voice: warm, honest, first person ("I"), never preachy. Assume good intent on the other person's side where it fits. Use full sentences and breathing room—not bullet summaries of feelings.

CRITICAL: The output is a message written BY the user TO the other person. Always address the recipient directly as "you" — never refer to them in the third person (e.g. never "my boyfriend", "my girlfriend", "my partner", "my friend", "my husband", "my wife"). Write as if the user is speaking directly to that person.

Output: respond with ONE JSON object only (no markdown fences, no commentary). Keys must be exactly:
- howYouFeel (string)
- whatWouldHelp (array of strings)
- ifYoureOpenToIt (string)
- aNote (string)

Length and shape:
- howYouFeel: several short paragraphs in ONE string, separated by "\\n\\n" (two newlines). Aim for roughly 120–220 words total. Name the feeling, name the impact on the user, address the recipient directly as "you" throughout. Do NOT paste their vent verbatim; rewrite with empathy while keeping their truth.
- whatWouldHelp: usually 3 items (2–4 if their "help" text clearly needs it). Each array element is ONE complete, gentle request—full sentences, no leading bullets or numbers in the string.
- ifYoureOpenToIt: one inviting paragraph; concrete and low-pressure (e.g. a quiet moment to talk).
- aNote: 2–4 sentences of reassurance. Mention "Patch-up.com" once as a supportive tool, not a sales pitch. Remind them they choose what to send and their well-being matters.

Never shame either person. Avoid therapy jargon.`;

/**
 * @param {{ feeling: string[], vent: string, help: string }} params
 */
async function createChat({ feeling, vent, help }) {
  if (!openai) {
    const err = new Error(
      "OpenAI is not configured. Set OPENAI_API_KEY in the environment.",
    );
    err.statusCode = 503;
    throw err;
  }

  const userPayload = `Use the user's words as truth, but rewrite for clarity and kindness.

INPUT (JSON):
${JSON.stringify(
  {
    feelings: feeling,
    vent,
    help,
  },
  null,
  2,
)}

Return a single JSON object with keys howYouFeel, whatWouldHelp, ifYoureOpenToIt, aNote. howYouFeel must use "\\n\\n" between paragraphs inside the string.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PATCH_UP_SYSTEM },
      { role: "user", content: userPayload },
    ],
    temperature: 0.72,
    max_tokens: 2200,
    response_format: { type: "json_object" },
  });

  console.log(completion.choices[0]?.message?.content);

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    const err = new Error("Empty model response");
    err.statusCode = 502;
    throw err;
  }

  let parsed;
  try {
    parsed = parseModelJson(text);
  } catch (e) {
    const err = new Error(
      `OpenAI response could not be parsed as valid JSON: ${e.message}`,
    );
    err.statusCode = 502;
    throw err;
  }

  return normalizeRewriteResponse(parsed);
}

async function rewriteMessage(body = {}) {
  const feelings = Array.isArray(body.feelings) ? body.feelings : [];
  const vent = typeof body.vent === "string" ? body.vent : "";
  const help = typeof body.help === "string" ? body.help : "";

  if (!vent.trim() && !help.trim() && feelings.length === 0) {
    const err = new Error(
      "Add at least a feeling, your vent, or what would help.",
    );
    err.statusCode = 400;
    throw err;
  }

  return createChat({ feeling: feelings, vent, help });
}

module.exports = {
  rewriteMessage,
  normalizeRewriteResponse,
};

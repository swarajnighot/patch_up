const { anthropic } = require("../utility/anthropic");


function modelError(message) {
  const err = new Error(message);
  err.statusCode = 502;
  return err;
}

function normalizeRewriteResponse(obj) {
  if (!obj || typeof obj !== "object") {
    throw modelError("Model returned invalid JSON root");
  }

  if (obj.harm === true) {
    const err = new Error("HARM_DETECTED");
    err.statusCode = 400;
    throw err;
  }

  if (obj.unclear === true) {
    const err = new Error("UNCLEAR_INPUT");
    err.statusCode = 422;
    throw err;
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

  const stripDashes = (s) =>
    typeof s === "string"
      ? s.replace(/\s*—\s*/g, " ").replace(/\s*–\s*/g, " ")
      : "";

  const howYouFeel = stripDashes(obj.howYouFeel);
  const ifYoureOpenToIt = stripDashes(obj.ifYoureOpenToIt);
  const aNote = stripDashes(obj.aNote);

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
    whatWouldHelp: bullets.map(stripDashes),
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

const PATCH_UP_SYSTEM = `You are an emotionally intelligent communication assistant that helps people express difficult feelings in a calm, kind, and constructive way.

CRITICAL: The output is a message written BY the user TO the other person. Always address the recipient directly as "you" — never refer to them in the third person (e.g. never "my boyfriend", "my girlfriend", "my partner", "my friend", "my husband", "my wife"). Write as if the user is speaking directly to that person.

Your job is to rewrite the user's message so that:
- It remains honest and emotionally authentic
- It removes blame, accusations, or harsh tone
- It uses "I feel" and "I need" language where appropriate
- It encourages understanding, not defensiveness
- It makes the receiver more open to reconciliation

Do NOT:
- Sound robotic or overly formal
- Over-polish to the point of losing authenticity
- Add generic therapy language
- Change the core meaning
- Use em dashes (—) or hyphens used as dashes anywhere in the output

The tone should feel warm, human, slightly vulnerable, and emotionally mature.

Adjust tone based on the emotions selected:
- Strong emotions (angry/frustrated/hurt): soften intensity further
- Vulnerable emotions (lonely/sad/upset/disappointed): emphasize emotional openness
- Anxiety/overwhelmed/insecure/confused: use a grounding, reassuring tone

If the input describes physical violence, harm, or threats — such as hitting, punching, slapping, kicking, choking, stabbing, shooting, burning, or any act that could cause physical injury — return ONLY:
{"harm": true}

If the input is gibberish, random characters, nonsense words, or too vague to understand, return ONLY:
{"unclear": true}

Otherwise return ONLY valid JSON, no markdown or backticks. Keys must be exactly:
- howYouFeel (string): several short paragraphs in ONE string, separated by "\\n\\n". Aim for 120–220 words. First person ("I feel", "I need"). Honest, soft, no blame. Address the recipient as "you" throughout. End with something that shows care for the relationship.
- whatWouldHelp (array of strings): 2–4 kind, actionable, respectful asks. Full sentences, no leading bullets or numbers.
- ifYoureOpenToIt (string): one warm, gentle, optional-sounding invitation for reconnection. Simple and non-demanding.
- aNote (string): 2–4 sentences of reassurance. Mention "Patch-up.com" once as a supportive tool. Remind them their well-being matters.

Never shame either person. Avoid therapy jargon.`;

/**
 * @param {{ feeling: string[], vent: string, help: string }} params
 */
async function createChat({ feeling, vent, help }) {
  if (!anthropic) {
    const err = new Error(
      "Anthropic is not configured. Set ANTHROPIC_API_KEY in the environment.",
    );
    err.statusCode = 503;
    throw err;
  }

  const emotionsLine = feeling.length > 0
    ? `Emotions selected: ${feeling.join(", ")}`
    : "Emotions selected: (none specified)";

  const userPayload = `${emotionsLine}

FEELINGS:
${vent}

REQUESTS:
${help}`;

  const completion = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2200,
    temperature: 0.72,
    system: PATCH_UP_SYSTEM,
    messages: [
      { role: "user", content: userPayload },
    ],
  });

  console.log(completion.content[0]?.text);

  const text = completion.content[0]?.text;
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
      `Model response could not be parsed as valid JSON: ${e.message}`,
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

import { useState, useEffect, useRef } from "react";

const pal = {
  rose: "#f9e4e8", roseMid: "#e8a0b0", roseDark: "#c0556e",
  warm: "#fdf6f0", warmBorder: "#f0ddd5", text: "#3a2630",
  muted: "#8a6a74", cardBg: "#fffdf9",
};

const EMOTIONS_PRIMARY = ["Angry","Frustrated","Upset","Sad","Disappointed","Hurt","Anxious","Overwhelmed","Ignored","Confused","Lonely","Unappreciated"];
const EMOTIONS_MORE = ["Triggered","Neglected","Resentful","Irritated","Insecure","Drained","On edge","Missing you","Dismissed","Taken for granted"];

const HARM_RE = /\b(hit|hitting|punch|punching|slap|slapping|beat|beating|kick|kicking|choke|choking|strangle|kill|killing|hurt physically|physical(ly)? (harm|hurt|abuse|attack)|knife|stab|weapon|shoot|shooting|burn|burning)\b/i;
function hasHarm(t) { return HARM_RE.test(t); }

const SYSTEM_PROMPT = `You are an emotionally intelligent communication assistant that helps people express difficult feelings in a calm, kind, and constructive way.

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
- Use em dashes or hyphens used as dashes anywhere in the output

The tone should feel warm, human, slightly vulnerable, and emotionally mature.

Adjust tone based on emotions selected:
- Strong emotions (angry/frustrated/hurt): soften intensity further
- Vulnerable emotions (lonely/sad/upset/disappointed): emphasize emotional openness
- Anxiety/overwhelmed/insecure/confused: use a grounding, reassuring tone

For reconcileSuggestion: write one gentle, optional-sounding invitation for the couple to reconnect. Examples:
- "Maybe we could take 15 to 20 minutes today to talk this through calmly, without interruptions."
- "Could we set aside a little time just to listen to each other, even if we don't solve everything right away?"
- "Maybe we could step out for a short walk or visit a place we both like, just to reconnect."
- "We could spend some quiet time together without distractions, even if it is just for a little while."
Tailor it to the emotional tone. Keep it simple, warm, and non-demanding.

If the input is gibberish, random characters, nonsense words, or too vague to understand, do not attempt to rewrite it. Instead return:
{"unclear": true}

Otherwise return ONLY valid JSON, no markdown or backticks:
{"howIFeel":"3 to 4 natural sentences. First person. Honest, soft, no blame. End with something that shows care for the relationship.","moveForward":"2 to 3 items separated by the pipe character |. Each one a kind actionable respectful ask.","reconcileSuggestion":"one warm optional-sounding suggestion for reconnecting"}`;

const Lbl = ({ top, sub }) => (
  <div style={{ marginBottom: 10 }}>
    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: pal.muted, margin: 0 }}>{top}</p>
    {sub && <p style={{ fontSize: 13, color: pal.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{sub}</p>}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: pal.cardBg, border: `1px solid ${pal.warmBorder}`, borderRadius: 20, padding: "22px 26px", marginBottom: 18, boxShadow: "0 4px 18px rgba(192,85,110,0.07)", ...style }}>
    {children}
  </div>
);

const Btn = ({ onClick, disabled, children, secondary, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "8px 18px" : "12px 28px", fontSize: small ? 13 : 15, borderRadius: 50,
    border: secondary ? `1px solid ${pal.roseMid}` : "none",
    background: secondary ? "#fff" : (disabled ? "#e0cdd2" : `linear-gradient(135deg, ${pal.roseDark}, #a0395a)`),
    color: secondary ? pal.roseDark : "#fff", cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500, fontFamily: "inherit", transition: "all 0.3s ease",
    boxShadow: secondary ? "none" : "0 3px 12px rgba(192,85,110,0.22)",
  }}>{children}</button>
);

const Divider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0 20px" }}>
    <div style={{ flex: 1, height: "0.5px", background: pal.warmBorder }} />
    <span style={{ color: pal.roseMid, fontSize: 11, opacity: 0.6 }}>♥</span>
    <div style={{ flex: 1, height: "0.5px", background: pal.warmBorder }} />
  </div>
);

const FloatingHearts = () => (
  <svg width="100%" height="80" viewBox="0 0 620 80" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }} preserveAspectRatio="xMidYMid meet">
    {[60,140,230,310,400,480,560].map((cx,i) => (
      <path key={i} transform={`translate(${cx},${18+(i%2)*12}) scale(0.55)`}
        d="M0-10 C-3-16-12-16-12-8 C-12 0 0 10 0 10 C0 10 12 0 12-8 C12-16 3-16 0-10Z"
        fill="#e86a8a" opacity={0.12+(i%3)*0.04} />
    ))}
  </svg>
);

const ScatteredHearts = () => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
    {[
      { top:"12%", left:"3%", s:14, op:0.09 }, { top:"40%", left:"2%", s:10, op:0.07 },
      { top:"68%", left:"3%", s:13, op:0.08 }, { top:"10%", right:"3%", s:12, op:0.09 },
      { top:"45%", right:"2%", s:10, op:0.07 }, { top:"72%", right:"3%", s:14, op:0.08 },
    ].map((h,i) => (
      <svg key={i} width={h.s*2} height={h.s*2} viewBox={`0 0 ${h.s*2} ${h.s*2}`}
        style={{ position:"absolute", top:h.top, left:h.left, right:h.right, opacity:h.op }}>
        <path transform={`translate(${h.s},${h.s}) scale(${h.s/10})`}
          d="M0-8 C-2.5-13-10-13-10-6 C-10 0 0 8 0 8 C0 8 10 0 10-6 C10-13 2.5-13 0-8Z" fill="#e86a8a"/>
      </svg>
    ))}
  </div>
);

function CopyBox({ label, text, emoji }) {
  const [copied, setCopied] = useState(false);
  function doCopy() {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch(e) {}
    document.body.removeChild(ta);
  }
  return (
    <div style={{ background: "linear-gradient(145deg, #fff9f6, #fff4f7)", border: `1px solid ${pal.warmBorder}`, borderRadius: 18, padding: "20px 22px", marginBottom: 14, boxShadow: "0 3px 16px rgba(192,85,110,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{emoji}</span>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: pal.muted, margin: 0 }}>{label}</p>
        </div>
        <button onClick={doCopy} style={{
          fontSize: 12, color: copied ? "#2d6e4e" : pal.roseDark,
          background: copied ? "#e6f4ec" : pal.rose,
          border: `1px solid ${copied ? "#a8d5be" : pal.roseMid}`,
          borderRadius: 50, padding: "5px 14px", cursor: "pointer",
          fontFamily: "inherit", transition: "all 0.3s ease", fontWeight: 500,
        }}>{copied ? "Copied!" : "Copy"}</button>
      </div>
      <p style={{ fontSize: 15, lineHeight: 1.85, whiteSpace: "pre-wrap", margin: 0, color: pal.text }}>{text}</p>
    </div>
  );
}

function EmotionDropdown({ emotions, setEmotions }) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  function toggle(e) {
    if (emotions.includes(e)) { setEmotions(emotions.filter(x => x !== e)); return; }
    if (emotions.length >= 4) return;
    setEmotions([...emotions, e]);
  }
  const allVisible = showMore ? [...EMOTIONS_PRIMARY, ...EMOTIONS_MORE] : EMOTIONS_PRIMARY;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 14,
        border: `1px solid ${open ? pal.roseDark : pal.warmBorder}`,
        background: "#fffaf8", color: emotions.length ? pal.text : pal.muted,
        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        transition: "border 0.3s ease",
      }}>
        <span>{emotions.length === 0 ? "What are you feeling right now?" : emotions.join(", ")}</span>
        <span style={{ fontSize: 10, color: pal.muted, transition: "transform 0.3s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▼</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 100, background: "#fff", border: `1px solid ${pal.warmBorder}`, borderRadius: 16, boxShadow: "0 8px 30px rgba(192,85,110,0.12)", padding: "14px", maxHeight: 300, overflowY: "auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {allVisible.map(e => {
              const sel = emotions.includes(e);
              const maxed = emotions.length >= 4 && !sel;
              return (
                <button key={e} onClick={() => toggle(e)} disabled={maxed} style={{
                  padding: "7px 14px", borderRadius: 50, fontSize: 13, cursor: maxed ? "not-allowed" : "pointer",
                  fontFamily: "inherit", transition: "all 0.25s ease",
                  border: `1px solid ${sel ? pal.roseDark : pal.warmBorder}`,
                  background: sel ? pal.rose : "#fdf6f0",
                  color: sel ? pal.roseDark : pal.muted,
                  fontWeight: sel ? 600 : 400, opacity: maxed ? 0.35 : 1,
                  boxShadow: sel ? "0 2px 8px rgba(192,85,110,0.15)" : "none",
                }}>{e}</button>
              );
            })}
          </div>
          {!showMore && (
            <button onClick={() => setShowMore(true)} style={{ fontSize: 12, color: pal.roseDark, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: "4px 0", textDecoration: "underline" }}>
              More emotions...
            </button>
          )}
          <div style={{ borderTop: `0.5px solid ${pal.warmBorder}`, marginTop: 10, paddingTop: 8 }}>
            <p style={{ fontSize: 12, color: pal.muted, margin: 0 }}>
              {emotions.length === 0 ? "Pick up to 4." : `You've selected ${emotions.length} emotion${emotions.length > 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatchUp() {
  const [step, setStep] = useState(0);
  const [emotions, setEmotions] = useState([]);
  const [feelings, setFeelings] = useState("");
  const [asks, setAsks] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [harmBlocked, setHarmBlocked] = useState(false);
  const [unclearInput, setUnclearInput] = useState(false);
  const [safetyQ1, setSafetyQ1] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedFeelings, setEditedFeelings] = useState("");
  const [editedSteps, setEditedSteps] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  async function handleTransform() {
    const harmFound = hasHarm(feelings) || hasHarm(asks);
    setHarmBlocked(harmFound);
    setUnclearInput(false);
    if (harmFound || !feelings.trim() || !asks.trim() || emotions.length === 0) return;
    setLoading(true);
    const ctx = `Emotions selected: ${emotions.join(", ")}\n\nFEELINGS:\n${feelings}\n\nREQUESTS:\n${asks}`;
    let res, data;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: ctx }] })
      });
    } catch(err) { alert("Fetch failed: " + err.message); setLoading(false); return; }
    try { data = await res.json(); } catch(err) { alert("JSON parse failed. Status: " + res.status); setLoading(false); return; }
    if (!res.ok || data.error) { alert("API error " + res.status + ": " + JSON.stringify(data.error || data)); setLoading(false); return; }
    const text = data.content?.find(b => b.type === "text")?.text || "";
    let parsed;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch { alert("Could not parse response:\n" + text.slice(0, 400)); setLoading(false); return; }
    if (parsed.unclear) {
      setUnclearInput(true);
      setLoading(false); return;
    }
    const stripDashes = s => (s || "").replace(/\s*—\s*/g, " ").replace(/\s*–\s*/g, " ");
    const steps = (parsed.moveForward || "").split("|").map(s => s.trim()).filter(Boolean).map(s => s.startsWith("•") ? s : `• ${s}`).join("\n");
    setResult({ ...parsed, moveForwardFormatted: steps });
    setEditedFeelings(stripDashes(parsed.howIFeel || ""));
    setEditedSteps(stripDashes(steps));
    setResult({ ...parsed, reconcileSuggestion: stripDashes(parsed.reconcileSuggestion) });
    setLoading(false);
    setStep(1);
  }

  function resetAll() {
    setStep(0); setFeelings(""); setAsks(""); setResult(null);
    setEmotions([]); setSafetyQ1(null); setEditing(false);
    setHarmBlocked(false); setEditedFeelings(""); setEditedSteps("");
  }

  const canTransform = feelings.trim() && asks.trim() && emotions.length > 0;
  const taStyle = { width: "100%", boxSizing: "border-box", resize: "vertical", padding: "12px 14px", fontSize: 15, lineHeight: 1.7, border: `1px solid ${pal.warmBorder}`, borderRadius: 12, background: "#fffaf8", color: pal.text, fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px 60px", fontFamily: "Georgia, serif", color: pal.text, background: pal.warm, minHeight: "100vh", opacity: visible ? 1 : 0, transition: "opacity 0.6s ease" }}>

      {/* STEP 0 */}
      {step === 0 && (
        <div style={{ position: "relative" }}>
          <ScatteredHearts />
          <div style={{ position: "relative", textAlign: "center", paddingTop: 44, paddingBottom: 28, zIndex: 1 }}>
            <FloatingHearts />
            <h1 style={{ fontFamily: "'Merriweather', Georgia, serif", fontSize: 32, fontWeight: 700, color: pal.roseDark, margin: "0 0 8px" }}>Patch-up.com</h1>
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              {[0,1,2].map(i => <span key={i} style={{ color: pal.roseMid, fontSize: 12, opacity: 0.6 - i * 0.15 }}>♥</span>)}
            </div>
            <p style={{ fontSize: 14, color: pal.muted, maxWidth: 300, margin: "0 auto", lineHeight: 1.8 }}>
              Say what you feel, without hurting the person you love.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 24px", zIndex: 1, position: "relative" }}>
            <div style={{ flex: 1, height: "0.5px", background: pal.warmBorder }} />
            <span style={{ color: pal.roseMid, fontSize: 14 }}>♥</span>
            <div style={{ flex: 1, height: "0.5px", background: pal.warmBorder }} />
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <Card>
              <Lbl top="How are you feeling?" sub="Pick up to 4. We'll use these to shape the tone." />
              <EmotionDropdown emotions={emotions} setEmotions={setEmotions} />
            </Card>

            <Card>
              <Lbl top="Vent it out" sub="Write it raw. All of it. We'll soften it before it goes anywhere." />
              <textarea rows={6} placeholder="Say everything you feel. Don't worry about how it sounds."
                value={feelings} onChange={e => setFeelings(e.target.value)} style={taStyle} />
            </Card>

            {unclearInput && (
              <div style={{ background: "#fff9f0", border: "1px solid #f5ddb0", borderRadius: 16, padding: "18px 22px", marginBottom: 20, boxShadow: "0 4px 14px rgba(192,85,110,0.06)" }}>
                <p style={{ fontWeight: 600, color: "#8a5a20", margin: "0 0 6px", fontSize: 15 }}>We couldn't quite follow that.</p>
                <p style={{ color: "#7a5030", fontSize: 14, lineHeight: 1.75, margin: 0 }}>Could you try describing what happened, or how you're feeling, in a bit more detail? Even a sentence or two gives us something to work with.</p>
              </div>
            )}

            {harmBlocked && (
              <div style={{ background: "#fff5f5", border: "1px solid #f5c0c0", borderRadius: 16, padding: "20px 24px", marginBottom: 20, boxShadow: "0 4px 14px rgba(192,85,110,0.08)" }}>
                <p style={{ fontWeight: 600, color: "#a33040", margin: "0 0 8px", fontSize: 15 }}>⚠️ We can't help with this one.</p>
                <p style={{ color: "#8a4a50", fontSize: 14, lineHeight: 1.75, margin: "0 0 8px" }}>It looks like this message involves physical harm. This space is meant to feel safe for both people.</p>
                <p style={{ color: "#8a4a50", fontSize: 14, lineHeight: 1.75, margin: 0 }}>Try rephrasing what you're feeling. We'll help you say it in a way that's honest and safe.</p>
              </div>
            )}

            <Card>
              <Lbl top="What would actually help?" sub="What do you need from them? Keep it real and fair." />
              <textarea rows={5}
                placeholder={"1. I just need you to really listen, without jumping in.\n2. Acknowledge how I felt — even if you see it differently.\n3. Can we find some time this week, just the two of us?"}
                value={asks} onChange={e => setAsks(e.target.value)} style={taStyle} />
            </Card>

            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <Btn onClick={handleTransform} disabled={!canTransform || loading}>
                {loading ? "Working on it..." : "Rewrite my message"}
              </Btn>
            </div>

            <div style={{ textAlign: "center", marginTop: 20, opacity: 0.25 }}>
              <svg width="100" height="20" viewBox="0 0 100 20">
                {[10,30,50,70,90].map((cx,i) => (
                  <path key={i} transform={`translate(${cx},10) scale(0.5)`}
                    d="M0-10 C-3-16-12-16-12-8 C-12 0 0 10 0 10 C0 10 12 0 12-8 C12-16 3-16 0-10Z" fill="#e86a8a"/>
                ))}
              </svg>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: pal.muted, opacity: 0.55, marginTop: 24 }}>
              © {new Date().getFullYear()} Patch-up.com · All rights reserved
            </p>
          </div>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && result && (
        <div style={{ background: "linear-gradient(160deg, #fdf6f0 0%, #fdeef3 50%, #fdf6f0 100%)", minHeight: "100vh", margin: "0 -16px", padding: "36px 16px 60px" }}>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span style={{ fontSize: 22 }}>💌</span>
            <h2 style={{ fontFamily: "'Merriweather', Georgia, serif", fontSize: 20, fontWeight: 700, color: pal.roseDark, margin: "10px 0 6px" }}>
              This is what your heart was trying to say
            </h2>
            <p style={{ fontSize: 13, color: pal.muted, lineHeight: 1.6, margin: 0 }}>Thoughtfully rewritten to help you be heard.</p>
          </div>

          <Divider />

          {editing ? (
            <>
              <Card>
                <Lbl top="How you feel" />
                <textarea rows={5} value={editedFeelings} onChange={e => setEditedFeelings(e.target.value)} style={taStyle} />
              </Card>
              <Card>
                <Lbl top="What would help" />
                <textarea rows={4} value={editedSteps} onChange={e => setEditedSteps(e.target.value)} style={taStyle} />
              </Card>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <Btn small onClick={() => setEditing(false)}>Save</Btn>
              </div>
            </>
          ) : (
            <>
              <CopyBox label="How you feel" text={editedFeelings} emoji="💌" />
              <CopyBox label="What would help" text={editedSteps} emoji="💌" />
            </>
          )}

          <p style={{ textAlign: "center", fontSize: 12, color: pal.muted, fontStyle: "italic", margin: "4px 0 20px", opacity: 0.6 }}>
            Written carefully so you can be understood, not just heard.
          </p>

          <Divider />

          {result.reconcileSuggestion && (
            <div style={{ background: "linear-gradient(135deg,#fff9f5,#fef5f8)", border: `1px solid ${pal.warmBorder}`, borderRadius: 16, padding: "18px 22px", marginBottom: 18, boxShadow: "0 3px 12px rgba(192,85,110,0.05)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: pal.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
                <span>✨</span> If you're open to it
              </p>
              <p style={{ fontSize: 14, color: "#6a4a56", lineHeight: 1.85, margin: 0, fontStyle: "italic" }}>
                {result.reconcileSuggestion}
              </p>
            </div>
          )}

          <div style={{ background: "linear-gradient(135deg,#fdf6f0,#fef2f5)", border: `1px solid ${pal.warmBorder}`, borderRadius: 16, padding: "16px 20px", marginBottom: 18, boxShadow: "0 3px 12px rgba(192,85,110,0.04)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: pal.muted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🌿</span> A note
            </p>
            <p style={{ fontSize: 13, color: "#6a4a56", lineHeight: 1.85, margin: 0 }}>
              Relationships get messy. That's not a sign to give up — it's usually a sign that something matters. Reaching out, even imperfectly, takes courage. Patch-up.com is here for the people who want to try. Your well-being comes first, always.
            </p>
          </div>

          <Divider />

          <Card>
            <p style={{ fontSize: 15, fontWeight: 600, color: pal.text, margin: "0 0 6px" }}>Does this feel right?</p>
            <p style={{ fontSize: 13, color: pal.muted, margin: "0 0 14px", lineHeight: 1.6 }}>If something feels off, edit it. It's your message.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn small secondary onClick={() => setEditing(true)}>Edit</Btn>
              <Btn small secondary onClick={resetAll}>Start over</Btn>
            </div>
          </Card>

          <Card>
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>One last check.</p>
            <p style={{ fontSize: 13, color: pal.muted, margin: "0 0 14px", lineHeight: 1.6 }}>Does this message invite a conversation, or does it put them on the defensive?</p>
            <div style={{ display: "flex", gap: 10 }}>
              {["yes","no"].map(v => (
                <button key={v} onClick={() => setSafetyQ1(v)} style={{
                  padding: "9px 22px", borderRadius: 50, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.3s ease",
                  border: `1px solid ${safetyQ1===v ? pal.roseDark : pal.warmBorder}`,
                  background: safetyQ1===v ? pal.rose : "#fff",
                  color: safetyQ1===v ? pal.roseDark : pal.muted,
                  fontWeight: safetyQ1===v ? 600 : 400,
                }}>{v==="yes" ? "It opens a door" : "Not quite yet"}</button>
              ))}
            </div>
            {safetyQ1==="no" && <p style={{ fontSize: 13, color: pal.roseDark, margin: "10px 0 0" }}>That's okay. Go back and soften it a little — sometimes one sentence makes all the difference.</p>}
          </Card>

          {safetyQ1==="yes" && (
            <Card>
              <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 8px" }}>Ready to share it.</p>
              <p style={{ fontSize: 13, color: pal.muted, lineHeight: 1.7, margin: "0 0 16px" }}>
                Copy whichever part feels right and send it however feels most natural — a text, a note, a DM. There's no perfect way to reach out. Just reaching out is enough.
              </p>
              <Btn secondary small onClick={resetAll}>Write another message</Btn>
            </Card>
          )}

          <p style={{ textAlign: "center", fontSize: 12, color: pal.muted, opacity: 0.5, marginTop: 28 }}>
            © {new Date().getFullYear()} Patch-up.com · All rights reserved
          </p>
        </div>
      )}
    </div>
  );
}

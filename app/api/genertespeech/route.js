import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    const { dt } = await req.json();

    if (!dt) {
      return new Response(
        JSON.stringify({ error: "Text input missing" }),
        { status: 400 }
      );
    }

    const response = await groq.audio.speech.create({
      model: "canopylabs/orpheus-v1-english",
      voice: "hannah",
      input: dt,
      response_format: "wav",
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": "inline; filename=speech.wav",
      },
    });
  } catch (err) {
    console.error("TTS error:", err);
    return new Response(
      JSON.stringify({ error: "Speech generation failed" }),
      { status: 500 }
    );
  }
}

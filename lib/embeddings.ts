import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function embedText(text: string): Promise<number[]> {
    const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    const first = res.data[0]
    if (!first) {
        throw new Error("No embedding returned from OpenAI")
    }

    return first.embedding;
}

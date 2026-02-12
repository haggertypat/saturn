import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_DIMENSIONS = 1536;

export async function embedText(text: string): Promise<number[]> {
    const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
    });

    const first = res.data[0]
    if (!first) {
        throw new Error("No embedding returned from OpenAI")
    }

    if (first.embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
            `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${first.embedding.length}.`
        );
    }

    return first.embedding;
}

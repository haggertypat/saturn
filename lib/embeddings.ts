import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Central configuration for embeddings so the DB vector
// dimensions and model stay in sync.
const EMBEDDING_MODEL =
    process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";

// This should match your Postgres `vector(1536)` definition.
// If you ever change the DB column, update this (or the env var)
// at the same time.
const EMBEDDING_DIMENSIONS = Number(
    process.env.OPENAI_EMBEDDING_DIMENSIONS ?? "1536"
);

export async function embedText(text: string): Promise<number[]> {
    const res = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        // For models that support flexible dimensions (like text-embedding-3-small),
        // this pins the output size so it matches the DB.
        dimensions: EMBEDDING_DIMENSIONS,
    });

    const first = res.data[0];
    if (!first) {
        throw new Error("No embedding returned from OpenAI");
    }

    const embedding = first.embedding;

    if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
            `Unexpected embedding dimension: got ${embedding.length}, expected ${EMBEDDING_DIMENSIONS}`
        );
    }

    return embedding;
}

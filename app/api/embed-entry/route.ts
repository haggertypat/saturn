// app/api/embed-entry/route.ts
import { NextResponse } from "next/server";
import { tryEmbedEntry } from "@/app/actions/entries";

export async function POST(req: Request) {
    const { id, body } = await req.json();

    // do not throw — background job
    try {
        await tryEmbedEntry(id, body);
    } catch {}

    return NextResponse.json({ ok: true });
}

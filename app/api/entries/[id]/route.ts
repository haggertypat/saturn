// app/api/entries/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    const { id } = await ctx.params;
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
}

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// --------------------
// CONFIG
// --------------------
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const INPUT_MD_PATH = path.resolve("./scripts/dreams.md");
const DRY_RUN = process.argv.includes("--dry-run");

// --------------------
// TYPES
// --------------------
type EntryInsert = {
    title: string;
    body: string;
    event_date: string; // yyyy-mm-dd
};

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars");
}

// --------------------
// HELPERS
// --------------------
function parseDate(dateLine: string): string {
    const d = new Date(dateLine);
    if (isNaN(d.getTime())) {
        throw new Error(`Could not parse date: "${dateLine}"`);
    }
    return d.toISOString().slice(0, 10);
}

// --------------------
// PARSER
// --------------------
function parseMarkdownEntries(markdown: string): EntryInsert[] {
    const lines = markdown.split(/\r?\n/);
    const entries: EntryInsert[] = [];

    let title: string | null = null;
    let dateLine: string | null = null;
    let bodyLines: string[] = [];

    function flush() {
        if (!title || !dateLine) return;

        entries.push({
            title: title.trim(),
            event_date: parseDate(dateLine),
            body: bodyLines.join("\n").trim(),
        });

        title = null;
        dateLine = null;
        bodyLines = [];
    }

    for (const line of lines) {
        if (line.startsWith("# ")) {
            flush();
            title = line.slice(2).trim();
            continue;
        }

        if (line.startsWith("## ") && title && !dateLine) {
            dateLine = line.slice(3).trim();
            continue;
        }

        if (dateLine) {
            bodyLines.push(line);
        }
    }

    flush();
    return entries;
}

// --------------------
// MAIN
// --------------------
async function run() {
    const markdown = fs.readFileSync(INPUT_MD_PATH, "utf8");
    const entries = parseMarkdownEntries(markdown);

    console.log(`Parsed ${entries.length} entries`);

    if (entries.length === 0) {
        console.log("No entries found. Exiting.");
        return;
    }

    // Show a sample
    console.log("Sample entry:");
    console.log({
        title: entries[0].title,
        event_date: entries[0].event_date,
        body_preview: entries[0].body.slice(0, 200),
    });

    if (DRY_RUN) {
        console.log("\nDRY RUN — no rows inserted");
        return;
    }

    const supabase = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY
    );

    for (const entry of entries) {
        const { error } = await supabase
            .from("entries")
            .insert(entry);

        if (error) {
            console.error("Insert failed:", entry.title);
            console.error(error);
            process.exit(1);
        }

        console.log(`Inserted: ${entry.title}`);
    }

    console.log("Import complete");
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});

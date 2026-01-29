import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch all valid program codes
export async function GET() {
    try {
        const programs = await prisma.validProgram.findMany({
            select: { code: true },
            orderBy: { code: 'asc' }
        });

        // Return as simple array of strings
        return NextResponse.json(programs.map(p => p.code));
    } catch (error) {
        console.error("Error fetching knowledge base:", error);
        return NextResponse.json({ error: "Failed to fetch knowledge base" }, { status: 500 });
    }
}

// POST: Overwrite or Update Knowledge Base using a comma/newline separated string
export async function POST(request: Request) {
    try {
        const { text } = await request.json();

        if (!text && text !== "") {
            return NextResponse.json({ error: "Missing text" }, { status: 400 });
        }

        // Parse input text: split by comma/newline, trim, filter empty
        const codes = text
            .split(/[\n,]+/)
            .map((s: string) => s.trim().toUpperCase())
            .filter((s: string) => s.length > 0 && /^[A-Z0-9]+$/.test(s)); // Basic sanity check

        // Use a transaction to safely update:
        // Option A (Simpler): We can just upsert. But user might want to DELETE removed ones if they edit the big text box.
        // Current logic in frontend was "Paste the whole list and save".
        // To mimic that, we should probably wipe and replace, OR just upsert new ones. 
        // Given the UI is a big text area, "Wipe and Replace" or "Sync" is closest to mental model.
        // But wiping might be dangerous if multiple people use it.
        // Let's assume "Sync" means "Make the DB match this list".

        // 1. Find all existing
        // 2. Determine what to add and what to delete (optional)
        // For now, let's just UPSERT all provided codes to ensure they exist. 
        // We won't delete ones missing from the input unless we're sure (User might paste partial list).
        // Wait, the UI is a text area showing the WHOLE list. So it's a full replacement.
        // Let's do a transactional delete and create to ensure it matches the text area exactly.

        // However, to be safe against accidental wiping, let's just Add new ones for now.
        // The user prompt said "get rid of browser cache mess". 
        // If they delete from text area, they expect it gone. 
        // So: Transaction [Delete All, Create Many].

        // SQLite doesn't support skipDuplicates in createMany.
        // We ensure uniqueness in the array first.
        const uniqueCodes = Array.from(new Set(codes)) as string[];

        await prisma.$transaction([
            prisma.validProgram.deleteMany({}),
            prisma.validProgram.createMany({
                data: uniqueCodes.map((code) => ({ code }))
            })
        ]);

        return NextResponse.json({ success: true, count: codes.length });

    } catch (error) {
        console.error("Error updating knowledge base:", error);
        return NextResponse.json({ error: "Failed to update knowledge base" }, { status: 500 });
    }
}

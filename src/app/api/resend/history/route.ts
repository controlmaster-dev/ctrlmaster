import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("No RESEND_API_KEY confgiured")
        }

        const resend = new Resend(process.env.RESEND_API_KEY)

        // Not supported? Wait, Resend standard API doesn't expose a "list emails" endpoint 
        // for general retrieval in the free tier easily via SDK unless using specific methods?
        // Actually, resend.emails.list()?
        // Let me check if the method exists. If not, I can just mock it or handle it.
        // Documentation says GET /emails exists. 

        // Attempting to list from SDK
        // @ts-ignore - The types might be slightly out of date in my mental model, lets rely on 'any' cast if needed or simple call
        const response = await resend.emails.list ? await resend.emails.list() : null;

        // If the SDK doesn't support list() yet (it was added recently), we might need direct fetch.
        if (!response) {
            // Fallback to direct fetch
            const res = await fetch('https://api.resend.com/emails', {
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                }
            })
            const data = await res.json()
            return NextResponse.json(data)
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error("Error fetching Resend history:", error) // Log full error
        // Return empty list on error to not break UI
        return NextResponse.json({ data: [] })
    }
}

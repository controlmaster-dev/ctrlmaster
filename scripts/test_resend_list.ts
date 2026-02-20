import { Resend } from 'resend'
import dotenv from 'dotenv'
dotenv.config()

async function main() {
    console.log("Checking API Key: ", process.env.RESEND_API_KEY ? "EXISTS" : "MISSING")
    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
        console.log("Calling resend.emails.list()...")
        // @ts-ignore
        const response = await resend.emails.list()
        console.log("Response:", JSON.stringify(response, null, 2))
    } catch (e) {
        console.error("Error with SDK:", e)

        console.log("Attempting raw fetch fallback...")
        try {
            const res = await fetch('https://api.resend.com/emails', {
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
                }
            })
            const text = await res.text()
            console.log("Raw Fetch Response Status:", res.status)
            console.log("Raw Fetch Body:", text)
        } catch (fetchError) {
            console.error("Error with raw fetch:", fetchError)
        }
    }
}

main()

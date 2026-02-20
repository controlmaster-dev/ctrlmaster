import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    }
})

interface EmailOptions {
    to: string | string[]
    subject: string
    html: string
    attachments?: { filename: string, content: Buffer | string }[]
    fromName?: string
    replyTo?: string
}

export async function sendEmail(options: EmailOptions) {
    try {
        const { to, subject, html, attachments, fromName = "Control Master", replyTo } = options;
        const info = await transporter.sendMail({
            from: `"${fromName}" <${process.env.SMTP_EMAIL}>`,
            to,
            replyTo,
            subject,
            html,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content
            }))
        })

        console.log("Email sent: ", info.messageId)
        return { success: true }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error }
    }
}

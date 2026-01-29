import { NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: "No files received." }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const filename = Date.now() + "_" + file.name.replace(/ /g, "_")
        const uploadDir = path.join(process.cwd(), "public/uploads")

        try {
            await writeFile(path.join(uploadDir, filename), buffer)
            return NextResponse.json({
                success: true,
                url: `/uploads/${filename}`,
                type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO'
            })
        } catch (error) {
            return NextResponse.json({ error: "Error saving file" }, { status: 500 })
        }

    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}

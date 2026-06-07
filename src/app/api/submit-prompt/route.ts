import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const prompt = formData.get('prompt') as string
        const model = formData.get('model') as string
        const image = formData.get('image') as File | null

        // Basic validation
        if (!name || !email || !prompt || !model) {
            return NextResponse.json(
                { error: 'Missing required fields.' },
                { status: 400 }
            )
        }

        if (prompt.trim().length < 20) {
            return NextResponse.json(
                { error: 'Prompt too short.' },
                { status: 400 }
            )
        }

        // Build attachments array — image never touches disk
        const attachments: { filename: string; content: Buffer }[] = []
        if (image && image.size > 0) {
            const arrayBuffer = await image.arrayBuffer()
            attachments.push({
                filename: image.name,
                content: Buffer.from(arrayBuffer),
            })
        }

        // Send email
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: process.env.RESEND_TO_EMAIL!,
            replyTo: email,
            subject: `[NeuwGenX] New Prompt Submission — ${name}`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <div style="background: #FF6B35; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: white; font-size: 20px;">New Prompt Submission</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">NeuwGenX Community</p>
          </div>

          <div style="background: #fff; border: 1px solid #F0EBE5; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F5F0EB; width: 120px;">
                  <span style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">Name</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F5F0EB;">
                  <span style="font-size: 14px; color: #111;">${name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #F5F0EB;">
                  <span style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">Email</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #F5F0EB;">
                  <a href="mailto:${email}" style="font-size: 14px; color: #FF6B35; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <span style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">AI Model</span>
                </td>
                <td style="padding: 10px 0;">
                  <span style="font-size: 14px; color: #111; background: #FFF6F2; border: 1px solid #FFD5C2; border-radius: 6px; padding: 2px 10px;">${model}</span>
                </td>
              </tr>
            </table>

            <div>
              <p style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px;">Prompt</p>
              <div style="background: #FAFAF9; border: 1px solid #F0EBE5; border-radius: 8px; padding: 16px;">
                <p style="font-size: 14px; color: #333; line-height: 1.7; margin: 0; white-space: pre-wrap;">${prompt.trim()}</p>
              </div>
            </div>

            ${attachments.length > 0 ? `
            <div style="margin-top: 20px;">
              <p style="font-size: 12px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 6px;">Image</p>
              <p style="font-size: 13px; color: #666; margin: 0;">📎 ${image!.name} attached below</p>
            </div>
            ` : ''}

          </div>

          <p style="text-align: center; font-size: 12px; color: #CCC; margin-top: 20px;">
            Sent from <a href="https://neuwgenx.com" style="color: #FF6B35; text-decoration: none;">NeuwGenX</a>
          </p>
        </div>
      `,
            attachments,
        })

        if (error) {
            console.error('Resend error:', error)
            return NextResponse.json(
                { error: 'Failed to send email.' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('API route error:', err)
        return NextResponse.json(
            { error: 'Internal server error.' },
            { status: 500 }
        )
    }
}
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

import { generatePromptPayPayload } from '@/lib/promptpay'

export const runtime = 'nodejs'

type RequestBody = {
  promptPay?: unknown
  amount?: unknown
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody

    const promptPay = body.promptPay
    const amount = body.amount

    if (
      typeof promptPay !== 'string' ||
      !promptPay.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณากรอก PromptPay',
        },
        { status: 400 }
      )
    }

    if (
      typeof amount !== 'string' &&
      typeof amount !== 'number'
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณากรอกจำนวนเงิน',
        },
        { status: 400 }
      )
    }

    const payload = generatePromptPayPayload({
      promptPay,
      amount,
    })

    const qr = await QRCode.toDataURL(
      payload,
      {
        type: 'image/png',
        width: 420,
        margin: 4,
        errorCorrectionLevel: 'M',
      }
    )

    return NextResponse.json({
      success: true,
      qr,
      payload,
    })
  } catch (error) {
    console.error(
      'PromptPay QR Error:',
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : 'ไม่สามารถสร้าง QR ได้'

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    )
  }
}
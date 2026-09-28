import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  try {
    await db.query('SELECT 1')

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
    })
  } catch (error) {
    console.error('Database Error:', error)

    return NextResponse.json(
      {
        status: 'ok',
        database: 'disconnected',
      },
      { status: 200 }
    )
  }
}
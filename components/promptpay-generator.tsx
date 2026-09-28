'use client'

import {
    useEffect,
    useRef,
    useState,
} from 'react'

import {
    validateAmount,
    validatePromptPay,
} from '@/lib/promptpay-validation'

type ApiStatus = {
    status: 'ok'
    database:
    | 'connected'
    | 'disconnected'
}

type GenerateQrResponse = {
    success: boolean
    qr?: string
    payload?: string
    error?: string
}

const QR_VALIDITY_MS = 5 * 60 * 1000

export default function PromptPayGenerator() {
    const [apiStatus, setApiStatus] =
        useState<ApiStatus | null>(null)

    const [promptPay, setPromptPay] =
        useState('')

    const [amount, setAmount] =
        useState('')

    const [qrCode, setQrCode] =
        useState<string | null>(null)

    const [payload, setPayload] =
        useState<string | null>(null)

    const [error, setError] =
        useState<string | null>(null)

    const [loading, setLoading] =
        useState(false)

    const [expiresAt, setExpiresAt] =
        useState<number | null>(null)

    const [remainingSeconds, setRemainingSeconds] =
        useState(0)

    const timerRef =
        useRef<ReturnType<typeof setInterval> | null>(
            null
        )

    /*
     * API health
     */
    useEffect(() => {
        fetch('/api/health')
            .then((response) => {
                if (!response.ok) {
                    throw new Error(
                        'API unavailable'
                    )
                }

                return response.json() as Promise<ApiStatus>
            })
            .then(setApiStatus)
            .catch(() => {
                setApiStatus(null)
            })
    }, [])

    /*
     * Countdown
     */
    useEffect(() => {
        if (!expiresAt) {
            setRemainingSeconds(0)

            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            return
        }

        const updateTimer = () => {
            const remaining =
                Math.max(
                    0,
                    expiresAt - Date.now()
                )

            const seconds =
                Math.ceil(
                    remaining / 1000
                )

            setRemainingSeconds(seconds)

            if (remaining <= 0) {
                setQrCode(null)
                setPayload(null)
                setExpiresAt(null)
                setError(
                    'QR Code หมดอายุแล้ว กรุณากรอกข้อมูลใหม่'
                )

                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }
        }

        updateTimer()

        timerRef.current =
            setInterval(
                updateTimer,
                1000
            )

        return () => {
            if (timerRef.current) {
                clearInterval(
                    timerRef.current
                )

                timerRef.current = null
            }
        }
    }, [expiresAt])

    /*
     * Generate QR
     */
    const generateQr = async (
        currentPromptPay: string,
        currentAmount: string
    ) => {
        const promptPayResult =
            validatePromptPay(
                currentPromptPay
            )

        if (!promptPayResult.valid) {
            return
        }

        const amountResult =
            validateAmount(
                currentAmount
            )

        if (!amountResult.valid) {
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response =
                await fetch(
                    '/api/promptpay/qr',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body: JSON.stringify({
                            promptPay:
                                currentPromptPay,
                            amount:
                                currentAmount,
                        }),
                    }
                )

            const data =
                (await response.json()) as GenerateQrResponse

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    'สร้าง QR ไม่สำเร็จ'
                )
            }

            if (!data.qr) {
                throw new Error(
                    'API ไม่ได้ส่ง QR กลับมา'
                )
            }

            setQrCode(data.qr)

            setPayload(
                data.payload ?? null
            )

            /*
             * Start 5 minute validity
             */
            const expiration =
                Date.now() +
                QR_VALIDITY_MS

            setExpiresAt(
                expiration
            )
        } catch (error) {
            setQrCode(null)
            setPayload(null)
            setExpiresAt(null)

            setError(
                error instanceof Error
                    ? error.message
                    : 'เกิดข้อผิดพลาด'
            )
        } finally {
            setLoading(false)
        }
    }

    /*
     * Auto generate
     *
     * รอ 500ms หลังหยุดพิมพ์
     */
    useEffect(() => {
        if (!promptPay || !amount) {
            return
        }

        const promptPayResult =
            validatePromptPay(
                promptPay
            )

        const amountResult =
            validateAmount(
                amount
            )

        /*
         * ถ้าข้อมูลยังไม่ถูก
         * ยังไม่สร้าง QR
         */
        if (
            !promptPayResult.valid ||
            !amountResult.valid
        ) {
            return
        }

        const timeout =
            setTimeout(() => {
                generateQr(
                    promptPay,
                    amount
                )
            }, 500)

        return () => {
            clearTimeout(timeout)
        }
    }, [promptPay, amount])

    /*
     * PromptPay input
     */
    const handlePromptPayChange = (
        value: string
    ) => {
        /*
         * ห้ามตัวอักษรหรือ /
         */
        if (!/^\d*$/.test(value)) {
            setError(
                'PromptPay ใช้ตัวเลขเท่านั้น'
            )

            return
        }

        setPromptPay(value)

        /*
         * ล้าง QR เก่าทันที
         */
        setQrCode(null)
        setPayload(null)
        setExpiresAt(null)
        setError(null)
    }

    /*
     * Amount input
     */
    const handleAmountChange = (
        value: string
    ) => {
        setAmount(value)

        /*
         * ล้าง QR เก่าทันที
         */
        setQrCode(null)
        setPayload(null)
        setExpiresAt(null)
        setError(null)
    }

    /*
     * Reset
     */
    const handleReset = () => {
        setPromptPay('')
        setAmount('')
        setQrCode(null)
        setPayload(null)
        setExpiresAt(null)
        setError(null)
        setLoading(false)
    }

    /*
     * Format countdown
     */
    const minutes =
        Math.floor(
            remainingSeconds / 60
        )
            .toString()
            .padStart(2, '0')

    const seconds =
        (remainingSeconds % 60)
            .toString()
            .padStart(2, '0')

    const formattedAmount =
        Number(amount || 0)
            .toLocaleString(
                'th-TH',
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                }
            )
    const promptPayValidation = promptPay
        ? validatePromptPay(promptPay)
        : null

    const amountValidation = amount
        ? validateAmount(amount)
        : null
    return (
        <main className="min-h-screen bg-stone-50 px-6 py-10 sm:px-10">
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <header className="mb-10 flex items-center justify-between border-b border-stone-300 pb-5">

                    <div>
                        <h1 className="font-semibold tracking-tight text-stone-900">
                            QR Code Generator
                        </h1>

                        <p className="mt-1 text-xs text-stone-500">
                            PromptPay
                        </p>
                    </div>

                    <span className="font-mono text-xs uppercase tracking-widest text-stone-500">
                        PromptPay
                    </span>

                </header>

                <section className="grid gap-6 md:grid-cols-2">

                    {/* ================= QR CARD ================= */}

                    <div className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm sm:p-8">

                        <div className="mb-6 flex items-start justify-between gap-4">

                            <div>
                                <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
                                    QR Code Generator
                                </p>

                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                                    PromptPay QR
                                </h2>

                            </div>

                            {qrCode &&
                                remainingSeconds > 0 && (
                                    <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-right">

                                        <p className="text-[10px] uppercase tracking-widest text-amber-700">
                                            Expires
                                        </p>

                                        <p className="font-mono text-sm font-semibold text-amber-900">
                                            {minutes}:{seconds}
                                        </p>

                                    </div>
                                )}

                        </div>

                        <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50">

                            {loading ? (
                                <div className="text-center">
                                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />

                                    <p className="mt-4 text-sm text-stone-500">
                                        กำลังสร้าง QR...
                                    </p>
                                </div>
                            ) : qrCode ? (

                                <div className="flex flex-col items-center">

                                    <div className="rounded-2xl bg-white p-4 shadow-sm">

                                        <img
                                            src={qrCode}
                                            alt="PromptPay QR Code"
                                            className="h-64 w-64"
                                        />

                                    </div>

                                    <p className="mt-5 text-sm text-stone-500">
                                        PromptPay QR
                                    </p>

                                    <p className="mt-1 text-3xl font-semibold text-stone-950">
                                        ฿{formattedAmount}
                                    </p>

                                    <p className="mt-1 text-sm text-stone-500">
                                        {promptPay}
                                    </p>

                                </div>

                            ) : (

                                <div className="px-6 text-center">

                                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-stone-100">

                                        <svg
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.7"
                                            className="h-8 w-8 text-stone-400"
                                        >
                                            <rect
                                                x="3"
                                                y="3"
                                                width="7"
                                                height="7"
                                                rx="1"
                                            />

                                            <rect
                                                x="14"
                                                y="3"
                                                width="7"
                                                height="7"
                                                rx="1"
                                            />

                                            <rect
                                                x="3"
                                                y="14"
                                                width="7"
                                                height="7"
                                                rx="1"
                                            />

                                            <path d="M14 14h3v3h-3z" />

                                            <path d="M18 18h3v3h-3z" />

                                            <path d="M18 14h3" />

                                            <path d="M14 18v3" />
                                        </svg>

                                    </div>

                                    <p className="font-medium text-stone-700">
                                        {error
                                            ? error
                                            : 'QR Code ยังไม่ถูกสร้าง'}
                                    </p>

                                    {!error && (
                                        <p className="mt-1 text-sm text-stone-500">
                                            กรอก PromptPay และจำนวนเงิน
                                            <br />
                                            ระบบจะสร้าง QR อัตโนมัติ
                                        </p>
                                    )}

                                </div>

                            )}

                        </div>

                        {error && qrCode && (
                            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        {/* Reset only */}
                        <button
                            type="button"
                            onClick={handleReset}
                            className="mt-6 w-full rounded-xl border border-stone-300 px-5 py-3.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                        >
                            Reset
                        </button>

                        {payload && (
                            <details className="mt-6">
                                <summary className="cursor-pointer text-sm font-medium text-stone-700">
                                    View PromptPay Payload
                                </summary>

                                <div className="mt-3 break-all rounded-xl bg-stone-950 p-4 font-mono text-xs leading-5 text-stone-200">
                                    {payload}
                                </div>
                            </details>
                        )}

                    </div>

                    {/* ================= PAYMENT CARD ================= */}

                    <div className="rounded-2xl border border-stone-300 bg-white p-6 shadow-sm sm:p-8">

                        <div className="mb-8">

                            <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
                                Payment Details
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                                PromptPay Information
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                                กรอกผู้รับเงินและจำนวนเงิน
                            </p>

                        </div>

                        {/* PromptPay */}
                        <div>

                            <label
                                htmlFor="promptpay"
                                className="mb-2 block text-sm font-medium text-stone-800"
                            >
                                PromptPay Number
                            </label>

                            <input
                                id="promptpay"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={promptPay}
                                onChange={(event) =>
                                    handlePromptPayChange(
                                        event.target.value
                                    )
                                }
                                placeholder="0812345678 หรือเลขบัตรประชาชน"
                                className={`w-full rounded-xl border ${error &&
                                    !qrCode
                                    ? 'border-red-300'
                                    : 'border-stone-300'
                                    } bg-white px-4 py-3.5 text-lg font-medium text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10`}
                            />

                            <p className="mt-2 text-xs text-stone-400">
                                10 หลัก = เบอร์โทรศัพท์ · 13 หลัก = เลขบัตรประชาชน
                            </p>

                            {promptPayValidation?.valid === false && (
                                <p className="mt-2 text-xs text-red-600">
                                    {promptPayValidation.error}
                                </p>
                            )}

                        </div>

                        {/* Amount */}
                        <div className="mt-6">

                            <label
                                htmlFor="amount"
                                className="mb-2 block text-sm font-medium text-stone-800"
                            >
                                Amount
                            </label>

                            <div className="relative">

                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-medium text-stone-400">
                                    ฿
                                </span>

                                <input
                                    id="amount"
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(event) =>
                                        handleAmountChange(
                                            event.target.value
                                        )
                                    }
                                    placeholder="0.00"
                                    className="w-full rounded-xl border border-stone-300 bg-white py-4 pl-10 pr-4 text-2xl font-semibold text-stone-950 outline-none transition placeholder:text-stone-300 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                                />

                            </div>

                            <p className="mt-2 text-xs text-stone-400">
                                ทศนิยมได้ไม่เกิน 2 ตำแหน่ง
                            </p>

                            {amount &&
                                !validateAmount(
                                    amount
                                ).valid && (
                                    <p className="mt-2 text-xs text-red-600">
                                        {
                                            validateAmount(
                                                amount
                                            ).error
                                        }
                                    </p>
                                )}

                        </div>

                        {/* Summary */}
                        <div className="mt-8 rounded-xl bg-stone-50 p-5">

                            <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
                                Payment Summary
                            </p>

                            <div className="mt-4 space-y-3">

                                <div className="flex items-center justify-between gap-4">

                                    <span className="text-sm text-stone-500">
                                        PromptPay
                                    </span>

                                    <span className="max-w-[220px] truncate text-sm font-medium text-stone-900">
                                        {promptPay || '-'}
                                    </span>

                                </div>

                                <div className="flex items-center justify-between gap-4">

                                    <span className="text-sm text-stone-500">
                                        Amount
                                    </span>

                                    <span className="text-xl font-semibold text-stone-950">
                                        ฿{formattedAmount}
                                    </span>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>

                <footer className="mt-6 flex justify-between border-t border-stone-300 pt-4 font-mono text-xs text-stone-500">
                    <span>PROMPTPAY QR</span>
                    <span>NEXT.JS / POSTGRESQL</span>
                </footer>

            </div>
        </main>
    )
}
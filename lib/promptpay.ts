import {
  validatePromptPay,
  validateAmount,
} from './promptpay-validation'

export type PromptPayType = 'mobile' | 'national_id'

function tlv(tag: string, value: string) {
  return `${tag}${value.length.toString().padStart(2, '0')}${value}`
}

function crc16CCITT(data: string) {
  let crc = 0xffff

  for (const byte of Buffer.from(data, 'ascii')) {
    crc ^= byte << 8

    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function normalizeMobile(value: string) {
  const digits = value.replace(/\D/g, '')

  // 0812345678
  if (/^0\d{9}$/.test(digits)) {
    return `0066${digits.slice(1)}`
  }

  // 66812345678
  if (/^66\d{9}$/.test(digits)) {
    return `00${digits}`
  }

  // 0066812345678
  if (/^0066\d{9}$/.test(digits)) {
    return digits
  }

  throw new Error('เบอร์โทรศัพท์ PromptPay ไม่ถูกต้อง')
}

function validateThaiNationalId(value: string) {
  if (!/^\d{13}$/.test(value)) {
    return false
  }

  let sum = 0

  for (let i = 0; i < 12; i++) {
    sum += Number(value[i]) * (13 - i)
  }

  const checkDigit = (11 - (sum % 11)) % 10

  return checkDigit === Number(value[12])
}

function normalizeNationalId(value: string) {
  const digits = value.replace(/\D/g, '')

  if (!/^\d{13}$/.test(digits)) {
    throw new Error('เลขบัตรประชาชนต้องมี 13 หลัก')
  }

  if (!validateThaiNationalId(digits)) {
    throw new Error('เลขบัตรประชาชนไม่ถูกต้อง')
  }

  return digits
}

function normalizeAmount(value: string | number) {
  const input = String(value)
    .replace(/,/g, '')
    .trim()


  if (!/^\d+(\.\d{1,2})?$/.test(input)) {
    throw new Error(
      'จำนวนเงินต้องเป็นตัวเลขและมีทศนิยมไม่เกิน 2 ตำแหน่ง'
    )
  }

  const [wholePart, decimalPart = ''] = input.split('.')

  const whole = BigInt(wholePart || '0')
  const decimal = decimalPart.padEnd(2, '0')

  // 0.00
  if (whole === 0n && decimal === '00') {
    throw new Error('จำนวนเงินต้องมากกว่า 0')
  }

  const amount = `${whole.toString()}.${decimal}`

  // ป้องกันข้อมูลยาวผิดปกติ
  if (amount.length > 13) {
    throw new Error('จำนวนเงินมากเกินไป')
  }

  return amount
}



export function generatePromptPayPayload({
  promptPay,
  amount,
}: {
  promptPay: string
  amount: string | number
}) {
  const promptPayResult =
    validatePromptPay(promptPay)

  if (!promptPayResult.valid) {
    throw new Error(promptPayResult.error)
  }

  const amountResult =
    validateAmount(String(amount))

  if (!amountResult.valid) {
    throw new Error(amountResult.error)
  }

  let promptPayValue: string
  let promptPaySubTag: '01' | '02'

  if (promptPayResult.type === 'mobile') {
    promptPayValue =
      `0066${promptPayResult.value.slice(1)}`

    promptPaySubTag = '01'
  } else {
    promptPayValue =
      promptPayResult.value

    promptPaySubTag = '02'
  }

  const amountText =
    Number(amount).toFixed(2)

  const merchantAccountInfo =
    tlv(
      '00',
      'A000000677010111'
    ) +
    tlv(
      promptPaySubTag,
      promptPayValue
    )

  let payload = ''

  payload += tlv('00', '01')

  payload += tlv('01', '12')

  payload += tlv(
    '29',
    merchantAccountInfo
  )

  payload += tlv('53', '764')

  payload += tlv(
    '54',
    amountText
  )

  payload += tlv('58', 'TH')

  payload += '6304'

  payload += crc16CCITT(payload)

  return payload
}
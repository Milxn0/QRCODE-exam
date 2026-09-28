export type PromptPayType = 'mobile' | 'national_id'

export type PromptPayValidation =
  | {
      valid: true
      type: PromptPayType
      value: string
    }
  | {
      valid: false
      error: string
    }

export function validateThaiNationalId(
  value: string
): boolean {
  if (!/^\d{13}$/.test(value)) {
    return false
  }

  let sum = 0

  for (let i = 0; i < 12; i++) {
    sum += Number(value[i]) * (13 - i)
  }

  const checkDigit =
    (11 - (sum % 11)) % 10

  return checkDigit === Number(value[12])
}

export function validatePromptPay(
  value: string
): PromptPayValidation {
  // ต้องเป็นตัวเลขเท่านั้น
  if (!/^\d+$/.test(value)) {
    return {
      valid: false,
      error: 'PromptPay ต้องเป็นตัวเลขเท่านั้น',
    }
  }

  // เบอร์โทรศัพท์
  if (/^0\d{9}$/.test(value)) {
    return {
      valid: true,
      type: 'mobile',
      value,
    }
  }

  // เลขบัตรประชาชน
  if (/^\d{13}$/.test(value)) {
    if (!validateThaiNationalId(value)) {
      return {
        valid: false,
        error: 'เลขบัตรประชาชนไม่ถูกต้อง',
      }
    }

    return {
      valid: true,
      type: 'national_id',
      value,
    }
  }

  return {
    valid: false,
    error:
      'PromptPay ต้องเป็นเบอร์โทรศัพท์ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก',
  }
}

export function validateAmount(
  value: string
): {
  valid: boolean
  error?: string
} {
  const amount = value.trim()

  if (!amount) {
    return {
      valid: false,
      error: 'กรุณากรอกจำนวนเงิน',
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    return {
      valid: false,
      error:
        'จำนวนเงินต้องเป็นตัวเลขและมีทศนิยมไม่เกิน 2 ตำแหน่ง',
    }
  }

  if (Number(amount) <= 0) {
    return {
      valid: false,
      error: 'จำนวนเงินต้องมากกว่า 0',
    }
  }

  return {
    valid: true,
  }
}
/**
 * RJSF `transformErrors`: ajv 오류를 한국어로 바꾸고 항목마다 문구 하나만 남긴다.
 * 선택은 ajv 가 const 오류를 선택지 수만큼 내므로 하나로 줄인다.
 */
import type { RJSFValidationError } from "@rjsf/utils"

import { PHONE_PATTERN } from "./compile"

type Message = (e: RJSFValidationError) => string

const count = (value: unknown) => Number(value).toLocaleString()

export const ERROR_MESSAGES: Record<string, Message> = {
  required: () => "입력해 주세요.",
  format: (e) => (e.params?.format === "email" ? "이메일 주소를 확인해 주세요." : e.params?.format === "date" ? "날짜를 확인해 주세요." : "형식을 확인해 주세요."),
  pattern: (e) => (e.params?.pattern === PHONE_PATTERN ? "전화번호를 확인해 주세요. 숫자, +, -, 빈칸만 씁니다." : "형식을 확인해 주세요."),
  maxLength: (e) => `${count(e.params?.limit)}자까지 입력할 수 있습니다.`,
  minLength: (e) => `${count(e.params?.limit)}자 이상 입력해 주세요.`,
  minimum: (e) => `${count(e.params?.limit)} 이상으로 입력해 주세요.`,
  maximum: (e) => `${count(e.params?.limit)} 이하로 입력해 주세요.`,
  type: (e) => (e.params?.type === "integer" ? "정수를 입력해 주세요." : e.params?.type === "number" ? "숫자를 입력해 주세요." : "값의 형식을 확인해 주세요."),
  oneOf: () => "목록에서 골라 주세요.",
  const: () => "목록에서 골라 주세요.",
  enum: () => "목록에서 골라 주세요.",
  uniqueItems: () => "같은 선택지를 두 번 고를 수 없습니다.",
}

const fallback: Message = () => "입력한 값을 확인해 주세요."

/** 문구를 바꾸려면 `messages` 로 덮는다 */
export function koreanErrors(messages: Record<string, Message> = {}) {
  const table = { ...ERROR_MESSAGES, ...messages }
  return (errors: RJSFValidationError[]): RJSFValidationError[] => {
    const seen = new Set<string>()
    const out: RJSFValidationError[] = []
    for (const e of errors) {
      const where = (e.property ?? "").replace(/^\./, "").split(/[.[]/)[0]
      if (where && seen.has(where)) continue
      if (where) seen.add(where)
      out.push({ ...e, message: (table[e.name ?? ""] ?? fallback)(e) })
    }
    return out
  }
}

export const transformErrors = koreanErrors()

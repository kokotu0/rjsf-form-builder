/**
 * 정의 → JSON Schema · UI Schema, 그리고 그릴 때 쓰는 순수 함수들.
 * React 를 가져오지 않는다. 서버나 node 시험에서 `@kokotu0/rjsf-form-builder/compile` 로 읽는다.
 *
 * 만드는 모양
 * - jsonSchema: `{ type: "object", properties, required, anyOf | allOf, "x-rules" }`
 *   항목은 평평하게 `properties` 에 든다. `required` 는 항목의 필수에서 만든다
 * - uiSchema: `{ "ui:order", "ui:options": { sections }, "ui:submitButtonOptions", <항목 ui> }`
 *   섹션은 `ui:options.sections` 에 `{ title, fields, grid, description? }` 로 적고 `ObjectFieldTemplate` 이 그린다
 * - 규칙 `oneOfRequired` 는 루트 `anyOf` (여럿이면 `allOf` 안의 `anyOf`) 와 `x-rules` 로 싣는다.
 *   RJSF 6 은 루트 `anyOf` 를 고르기 상자로 그리므로 그릴 때는 `renderSchema` 로 빼고 `rulesValidate` 로 검사한다
 */
import type {
  FieldDefinition,
  FieldKind,
  FormDefinition,
  FormRule,
  FormSchemas,
  JsonObject,
  LayoutSection,
  SectionDefinition,
  StoredRule,
} from "./types"

/** 전화번호. 입력한 그대로 둔다: 숫자, +, -, 괄호, 점, 빈칸 */
export const PHONE_PATTERN = "^[0-9+()\\-. ]{4,40}$"

/** [기본, 최대] 글자 수 */
export const TEXT_LIMITS: Record<"text" | "textarea", [number, number]> = { text: [200, 2000], textarea: [5000, 20000] }

export const FIELD_KINDS: FieldKind[] = ["text", "textarea", "phone", "email", "number", "integer", "date", "select", "multiselect", "checkbox"]

export const hasOptions = (kind: FieldKind) => kind === "select" || kind === "multiselect"

const clean = (text: string | undefined) => (text ?? "").trim()

function options(field: FieldDefinition) {
  return (field.schema.options ?? []).map((o) => ({ const: clean(o.value), title: clean(o.label) }))
}

export function fieldJsonSchema(field: FieldDefinition): JsonObject {
  const s = field.schema
  const out: JsonObject = { title: clean(s.title) }
  if (clean(s.description)) out.description = clean(s.description)
  const kind = field.kind
  if (kind === "text" || kind === "textarea") {
    const [fallback, cap] = TEXT_LIMITS[kind]
    Object.assign(out, { type: "string", maxLength: Math.min(s.maxLength || fallback, cap) })
  } else if (kind === "phone") {
    Object.assign(out, { type: "string", pattern: PHONE_PATTERN, maxLength: 40 })
  } else if (kind === "email") {
    Object.assign(out, { type: "string", format: "email", maxLength: 254 })
  } else if (kind === "date") {
    Object.assign(out, { type: "string", format: "date" })
  } else if (kind === "number" || kind === "integer") {
    out.type = kind
    if (s.minimum !== undefined && s.minimum !== null) out.minimum = s.minimum
    if (s.maximum !== undefined && s.maximum !== null) out.maximum = s.maximum
  } else if (kind === "select") {
    Object.assign(out, { type: "string", oneOf: options(field) })
  } else if (kind === "multiselect") {
    Object.assign(out, { type: "array", uniqueItems: true, items: { type: "string", oneOf: options(field) } })
  } else if (kind === "checkbox") {
    out.type = "boolean"
  }
  for (const [key, value] of Object.entries(field.extra ?? {})) {
    if (key.startsWith("x-") && value !== undefined && value !== null && value !== "") out[key] = value
  }
  return out
}

export function fieldUiSchema(field: FieldDefinition): JsonObject {
  const ui: JsonObject = {}
  if (field.kind === "textarea") ui["ui:widget"] = "textarea"
  else if (field.kind === "phone") ui["ui:inputType"] = "tel"
  else if (field.kind === "select") ui["ui:widget"] = field.ui.widget === "radio" ? "radio" : "select"
  else if (field.kind === "multiselect") ui["ui:widget"] = "checkboxes"
  if (clean(field.ui.placeholder)) ui["ui:placeholder"] = clean(field.ui.placeholder)
  return ui
}

/** 규칙 하나면 루트 `anyOf`, 여럿이면 `allOf` 안의 `anyOf` */
export function ruleSchema(rules: StoredRule[]): JsonObject {
  const parts = rules.map((r) => ({ anyOf: r.oneOfRequired.map((key) => ({ required: [key] })) }))
  if (parts.length === 0) return {}
  if (parts.length === 1) return parts[0]
  return { allOf: parts }
}

function layout(section: SectionDefinition): LayoutSection {
  const grid = section.ui.grid ?? 1
  if (section.type === "image") {
    const placed: LayoutSection = { type: "image", title: clean(section.title), fields: [], grid }
    const src = section.content?.url || section.content?.file
    if (src) placed.src = src
    if (clean(section.content?.alt)) placed.alt = clean(section.content?.alt)
    return placed
  }
  const placed: LayoutSection = section.type === "description" ? { type: "description", title: clean(section.title), fields: [], grid } : { title: clean(section.title), fields: section.fields.map((f) => f.name), grid }
  if (clean(section.description)) placed.description = clean(section.description)
  return placed
}

/** 항목이 든 섹션만 항목을 낸다 */
export const fieldsOf = (definition: FormDefinition) => definition.sections.flatMap((s) => (s.type === "fields" ? s.fields : []))

export function compileDefinition(definition: FormDefinition): FormSchemas {
  const properties: JsonObject = {}
  const fieldUi: JsonObject = {}
  const order: string[] = []
  const sections: LayoutSection[] = []
  for (const section of definition.sections) {
    sections.push(layout(section))
    if (section.type !== "fields") continue
    for (const field of section.fields) {
      properties[field.name] = fieldJsonSchema(field)
      const ui = fieldUiSchema(field)
      if (Object.keys(ui).length > 0) fieldUi[field.name] = ui
      order.push(field.name)
    }
  }
  const fields = fieldsOf(definition)
  const rules: StoredRule[] = (definition.rules ?? []).map((r) => ({ oneOfRequired: [...r.keys], message: clean(r.message) }))
  const jsonSchema: JsonObject = {
    type: "object",
    properties,
    required: fields.filter((f) => f.required).map((f) => f.name),
    ...ruleSchema(rules),
  }
  if (rules.length > 0) jsonSchema["x-rules"] = rules
  const uiSchema: JsonObject = {
    "ui:order": order,
    "ui:options": { sections },
    "ui:submitButtonOptions": { norender: true },
    ...fieldUi,
  }
  return { jsonSchema, uiSchema }
}

// ============ 그릴 때 ============

/** 저장한 스키마에서 그릴 스키마를 만든다. 루트 anyOf · allOf · x-rules 를 빼고 규칙은 따로 돌려준다 */
export function renderSchema(jsonSchema: JsonObject): { schema: JsonObject; rules: StoredRule[] } {
  const { anyOf: _any, allOf: _all, "x-rules": rules, ...rest } = jsonSchema as JsonObject & { "x-rules"?: StoredRule[] }
  return { schema: rest, rules: rules ?? [] }
}

export const isFilled = (value: unknown) => value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0)

/** 어긴 규칙마다 `{ keys, message }` */
export function brokenRules(rules: StoredRule[], data: Record<string, unknown> | undefined): { keys: string[]; message: string }[] {
  return rules.filter((r) => !r.oneOfRequired.some((key) => isFilled(data?.[key]))).map((r) => ({ keys: r.oneOfRequired, message: r.message }))
}

type ErrorsLike = Record<string, { addError?: (message: string) => void } | undefined>

/** RJSF `customValidate`. 어긴 규칙의 문구를 든 항목 모두에 붙인다 */
export function rulesValidate<T extends object>(rules: StoredRule[]) {
  return (data: Record<string, unknown> | undefined, errors: T): T => {
    for (const broken of brokenRules(rules, data)) {
      for (const key of broken.keys) (errors as unknown as ErrorsLike)[key]?.addError?.(broken.message)
    }
    return errors
  }
}

/** 선택이 첫 선택지로 미리 차지 않게. 차면 필수 검사가 걸리지 않는다 */
export const FORM_STATE_BEHAVIOR = { constAsDefaults: "skipOneOf", emptyObjectFields: "skipDefaults" } as const

// ============ 정의 만들기 ============

export const uid = () => Math.random().toString(36).slice(2, 10)
export const defaultKey = (n: number) => `field${n}`

export function emptyDefinition(): FormDefinition {
  return { id: uid(), nextKey: 1, sections: [{ id: uid(), name: "section1", title: "", type: "fields", fields: [], ui: { grid: 1 } }], rules: [] }
}

/** 정의에 든 키와 종류. 저장한 정의로 만들면 잠글 키가 된다 */
export function kindsOf(definition: FormDefinition): Map<string, FieldKind> {
  return new Map(fieldsOf(definition).map((f) => [f.name, f.kind] as const))
}

export interface DefinitionProblem {
  /** 항목 id. 양식 전체 문제면 없다 */
  fieldId?: string
  message: string
}

/** 저장 전에 볼 것. 비면 저장해도 된다 */
export function checkDefinition(definition: FormDefinition): DefinitionProblem[] {
  const problems: DefinitionProblem[] = []
  const fields = fieldsOf(definition)
  if (fields.length === 0) problems.push({ message: "항목을 하나 이상 넣어 주세요." })
  for (const f of fields) {
    const name = clean(f.schema.title) || f.name
    if (!clean(f.schema.title)) problems.push({ fieldId: f.id, message: `${f.name} 의 제목을 넣어 주세요.` })
    if (hasOptions(f.kind)) {
      const options = f.schema.options ?? []
      if (options.length === 0) problems.push({ fieldId: f.id, message: `'${name}' 에 선택지를 하나 이상 넣어 주세요.` })
      if (options.some((o) => !clean(o.label))) problems.push({ fieldId: f.id, message: `'${name}' 의 선택지 이름을 넣어 주세요.` })
      const values = options.map((o) => clean(o.value))
      if (new Set(values).size !== values.length) problems.push({ fieldId: f.id, message: `'${name}' 의 선택지가 겹칩니다.` })
    }
    const { minimum, maximum } = f.schema
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) problems.push({ fieldId: f.id, message: `'${name}' 의 최솟값이 최댓값보다 큽니다.` })
  }
  for (const r of definition.rules ?? []) {
    if (r.keys.length < 2) problems.push({ message: "규칙마다 항목을 둘 이상 고르세요." })
    if (!clean(r.message)) problems.push({ message: "규칙의 안내 문구를 넣어 주세요." })
  }
  return problems
}

/** 규칙에서 없는 항목을 뺀다. 항목이 둘 아래로 줄면 `checkDefinition` 이 알린다 */
export function tidyRules(definition: FormDefinition): FormRule[] {
  const names = new Set(fieldsOf(definition).map((f) => f.name))
  return (definition.rules ?? []).map((r) => ({ ...r, keys: r.keys.filter((k) => names.has(k)) }))
}

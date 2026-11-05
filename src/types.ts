import type { ReactNode } from "react"

/**
 * FormBuilder 타입 (0.2.0)
 *
 * FormDefinition
 *   └── SectionDefinition[]   배치만 맡는다. 값(formData)은 섹션과 상관없이 평평하다
 *         └── FieldDefinition[]
 *
 * 0.1 과 다른 점
 * - data 가 평평하다. 섹션은 루트 uiSchema 의 `ui:options.sections` 로만 적는다
 * - 항목마다 `kind` 가 있다. JSON Schema · UI Schema 는 kind 에서 만든다
 * - 항목 키는 `field1`, `field2` … 이다. `FormDefinition.nextKey` 가 다음 번호이고 지운 번호는 다시 쓰지 않는다
 * - 선택지는 `{ value, label }` 이다. 값은 처음 이름으로 정하고 이름을 바꿔도 그대로다
 * - `extra` 의 `x-` 설정을 항목 스키마에 그대로 싣는다
 * - 양식 규칙 `oneOfRequired` (여럿 중 하나는 필수)
 */

// ============ 항목 ============

export type FieldKind =
  | "text"
  | "textarea"
  | "phone"
  | "email"
  | "number"
  | "integer"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"

export interface FieldOption {
  /** 저장되는 값. 처음 이름으로 정하고 바꾸지 않는다 */
  value: string
  /** 화면에 보이는 이름 */
  label: string
}

export interface FieldSchema {
  title: string
  description?: string
  /** text · textarea. 없으면 200 · 5000, 최대 2000 · 20000 */
  maxLength?: number
  /** number · integer */
  minimum?: number
  maximum?: number
  /** select · multiselect */
  options?: FieldOption[]
}

export interface FieldUiSchema {
  /** select 는 "select" | "radio". multiselect 는 늘 checkboxes */
  widget?: "select" | "radio" | "checkboxes"
  placeholder?: string
}

/** `x-` 로 시작하는 키만 스키마에 실린다 */
export type FieldExtra = { [key: `x-${string}`]: unknown }

export interface FieldDefinition {
  id: string
  /** 값의 키. 기본은 `field<번호>` */
  name: string
  kind: FieldKind
  required: boolean
  schema: FieldSchema
  ui: FieldUiSchema
  extra?: FieldExtra
}

// ============ 섹션 ============

export type SectionType = "fields" | "image" | "description"

export interface ImageContent {
  url?: string
  file?: string
  alt?: string
  width?: number | string
  height?: number | string
}

export interface SectionDefinition {
  id: string
  name: string
  title: string
  description?: string
  type: SectionType
  /** type 이 "fields" 일 때만 쓴다 */
  fields: FieldDefinition[]
  /** type 이 "image" 일 때 */
  content?: ImageContent
  ui: { grid?: number }
}

// ============ 규칙 · 양식 ============

/** keys 중 하나는 값이 있어야 한다 */
export interface FormRule {
  type: "oneOfRequired"
  keys: string[]
  message: string
}

export interface FormDefinition {
  id: string
  /** 다음 항목 번호. 지운 번호는 다시 쓰지 않는다 */
  nextKey: number
  sections: SectionDefinition[]
  rules?: FormRule[]
}

// ============ 변환 결과 ============

export type JsonObject = Record<string, unknown>

/** 저장한 스키마의 `x-rules` 한 줄 */
export interface StoredRule {
  oneOfRequired: string[]
  message: string
}

/** 루트 `ui:options.sections` 한 줄 */
export interface LayoutSection {
  type?: "image" | "description"
  title: string
  description?: string
  fields: string[]
  grid: number
  src?: string
  alt?: string
}

export interface FormSchemas {
  jsonSchema: JsonObject
  uiSchema: JsonObject
}

// ============ 훅 ============

export interface UseFormBuilderOptions {
  /** 키 만들기. 기본은 `field<번호>` */
  keyOf?: (n: number) => string
  /** 종류를 바꾸지 못하게 할 키와 그 종류. 기본은 처음 정의에 든 항목 */
  locked?: ReadonlyMap<string, FieldKind>
  /** 정의가 바뀔 때마다. 처음 값으로는 부르지 않는다 */
  onChange?: (definition: FormDefinition, schemas: FormSchemas) => void
}

export interface UseFormBuilderReturn {
  form: FormDefinition
  schemas: FormSchemas
  fields: FieldDefinition[]
  locked: ReadonlyMap<string, FieldKind>

  addSection: (section?: Partial<SectionDefinition>) => SectionDefinition
  updateSection: (sectionId: string, updates: Partial<SectionDefinition>) => void
  /** 항목은 옆 섹션으로 옮긴다. 섹션이 하나면 지우지 않는다 */
  removeSection: (sectionId: string) => void
  moveSection: (sectionId: string, direction: "up" | "down") => void
  reorderSection: (activeId: string, overId: string) => void

  /** 키는 그때의 nextKey 로 매긴다 */
  addField: (sectionId: string, field?: Partial<FieldDefinition>) => FieldDefinition
  updateField: (sectionId: string, fieldId: string, updates: Partial<FieldDefinition>) => void
  /** 잠긴 키는 바꾸지 않는다 */
  setKind: (fieldId: string, kind: FieldKind) => void
  /** 지운 항목이 든 규칙도 함께 지운다 */
  removeField: (sectionId: string, fieldId: string) => void
  /** 섹션 끝에서 넘어가면 옆 섹션으로 간다 */
  moveField: (sectionId: string, fieldId: string, direction: "up" | "down") => void
  reorderField: (sectionId: string, activeId: string, overId: string) => void

  setRules: (rules: FormRule[]) => void

  toSchemas: () => FormSchemas
  getSection: (sectionId: string) => SectionDefinition | undefined
  getField: (sectionId: string, fieldId: string) => FieldDefinition | undefined
  reset: () => void
  loadForm: (form: FormDefinition) => void
}

// ============ 컴포넌트 ============

export interface FormBuilderIcons {
  add?: ReactNode
  remove?: ReactNode
  up?: ReactNode
  down?: ReactNode
  drag?: ReactNode
  expand?: ReactNode
  collapse?: ReactNode
}

export interface FormBuilderProps {
  /** 바깥에서 만든 훅. 없으면 initialForm 으로 안에서 만든다 */
  builder?: UseFormBuilderReturn
  initialForm?: FormDefinition
  keyOf?: (n: number) => string
  locked?: ReadonlyMap<string, FieldKind>
  onChange?: (definition: FormDefinition, schemas: FormSchemas) => void
  onSchemaChange?: (schema: JsonObject) => void
  onUiSchemaChange?: (uiSchema: JsonObject) => void
  /** 고를 수 있는 종류. 기본은 모두 */
  kinds?: FieldKind[]
  /** 고를 수 있는 섹션 종류. 하나면 고르기 상자를 숨긴다 */
  sectionTypes?: SectionType[]
  /** 규칙 편집을 보일지. 기본 true */
  showRules?: boolean
  /** 항목 편집 아래에 붙일 것. 예: 요약 설정 */
  renderFieldExtra?: (field: FieldDefinition, update: (updates: Partial<FieldDefinition>) => void) => ReactNode
  /** 키를 보일지. 기본 true */
  showKeys?: boolean
  icons?: FormBuilderIcons
  selectedFieldId?: string | null
  onFieldSelect?: (fieldId: string | null) => void
}

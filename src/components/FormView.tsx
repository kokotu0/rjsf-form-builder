import { forwardRef, useImperativeHandle, useMemo, useRef } from "react"
import Form from "@rjsf/mui"
import type { ErrorSchema, RegistryWidgetsType, RJSFSchema, RJSFValidationError, UiSchema } from "@rjsf/utils"
import validator from "@rjsf/validator-ajv8"

import { FORM_STATE_BEHAVIOR, renderSchema, rulesValidate } from "../compile"
import { koreanErrors } from "../errors"
import type { JsonObject } from "../types"
import { customTemplates } from "./CustomTemplates"
import { customWidgets } from "./CustomWidgets"

export type FormValues = Record<string, unknown>

export interface FormViewHandle {
  /** 화면에서 검사하고 오류를 보인다. 통과하면 true */
  validate: () => boolean
}

export interface FormViewProps {
  /** 저장한 JSON Schema. 규칙(anyOf · x-rules)이 들어 있어도 된다 */
  schema: JsonObject
  uiSchema: JsonObject
  formData: FormValues
  onChange: (data: FormValues) => void
  /** 항목 키마다 붙일 오류. 서버 오류에 쓴다 */
  extraErrors?: Record<string, string[]>
  disabled?: boolean
  readonly?: boolean
  /** 한 화면에 양식이 둘일 때 입력 id 가 겹치지 않게 */
  idPrefix?: string
  widgets?: RegistryWidgetsType
  /** 오류 문구 바꾸기. 키는 ajv 오류 이름 */
  messages?: Record<string, (e: RJSFValidationError) => string>
  /** 제출 단추를 그리는 uiSchema 일 때 */
  onSubmit?: (data: FormValues) => void
}

/**
 * 저장한 양식을 그린다. `@rjsf/mui` 의 Form 에 이 패키지의 설정을 얹은 것이다.
 * - 루트 anyOf · allOf 는 빼고 그리고, 같은 규칙을 `x-rules` 로 검사한다
 * - 선택은 첫 선택지를 미리 넣지 않는다
 * - 오류는 한국어, 항목마다 하나
 */
export const FormView = forwardRef<FormViewHandle, FormViewProps>(function FormView(
  { schema: stored, uiSchema, formData, onChange, extraErrors, disabled, readonly, idPrefix, widgets, messages, onSubmit },
  ref,
) {
  const { schema, rules } = useMemo(() => renderSchema(stored), [stored])
  const customValidate = useMemo(() => rulesValidate(rules), [rules])
  const transformErrors = useMemo(() => koreanErrors(messages), [messages])
  const allWidgets = useMemo(() => ({ ...customWidgets, ...widgets }), [widgets])
  const form = useRef<{ validateForm: () => boolean } | null>(null)
  useImperativeHandle(ref, () => ({ validate: () => form.current?.validateForm() ?? false }), [])

  const errors = useMemo(() => {
    if (!extraErrors || Object.keys(extraErrors).length === 0) return undefined
    return Object.fromEntries(Object.entries(extraErrors).map(([key, list]) => [key, { __errors: list }])) as ErrorSchema<FormValues>
  }, [extraErrors])

  return (
    <Form
      ref={form as never}
      idPrefix={idPrefix}
      schema={schema as RJSFSchema}
      uiSchema={uiSchema as UiSchema}
      formData={formData}
      validator={validator}
      templates={customTemplates}
      widgets={allWidgets}
      noHtml5Validate
      showErrorList={false}
      disabled={disabled}
      readonly={readonly}
      transformErrors={transformErrors}
      customValidate={customValidate as never}
      extraErrors={errors}
      experimental_defaultFormStateBehavior={FORM_STATE_BEHAVIOR}
      onChange={(e) => onChange((e.formData ?? {}) as FormValues)}
      onSubmit={(e) => onSubmit?.((e.formData ?? {}) as FormValues)}
    />
  )
})

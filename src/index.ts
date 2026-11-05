// 편집기
export { FormBuilder } from "./FormBulider"
export { useFormBuilder } from "./useFormBuilder"
export { SectionEditor, FieldEditor, RulesEditor, DEFAULT_RULE_MESSAGE, DEFAULT_ICONS } from "./components"

// 그리기
export { FormView, ObjectFieldTemplate, SubmitButton, customTemplates, customWidgets, PhoneNumberWidget, UpDownWidget } from "./components"
export type { FormViewHandle, FormViewProps, FormValues } from "./components"
export { koreanErrors, transformErrors, ERROR_MESSAGES } from "./errors"

// 정의 → 스키마 (React 없이 쓰려면 "@kokotu0/rjsf-form-builder/compile")
export {
  compileDefinition,
  fieldJsonSchema,
  fieldUiSchema,
  ruleSchema,
  renderSchema,
  rulesValidate,
  brokenRules,
  isFilled,
  checkDefinition,
  tidyRules,
  emptyDefinition,
  kindsOf,
  fieldsOf,
  hasOptions,
  defaultKey,
  FORM_STATE_BEHAVIOR,
  PHONE_PATTERN,
  TEXT_LIMITS,
  FIELD_KINDS,
} from "./compile"
export type { DefinitionProblem } from "./compile"

export { KIND_LABELS, SECTION_TYPE_LABELS, SELECT_DISPLAY_LABELS } from "./constants"

export type {
  FieldKind,
  FieldOption,
  FieldSchema,
  FieldUiSchema,
  FieldExtra,
  FieldDefinition,
  SectionType,
  SectionDefinition,
  ImageContent,
  FormRule,
  FormDefinition,
  JsonObject,
  StoredRule,
  LayoutSection,
  FormSchemas,
  UseFormBuilderOptions,
  UseFormBuilderReturn,
  FormBuilderIcons,
  FormBuilderProps,
} from "./types"

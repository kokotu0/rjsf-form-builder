# RJSF Form Builder

[react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)(RJSF) 6 과 MUI 로 양식을 만들고 그리는 패키지입니다.
편집기(`FormBuilder`), 정의를 다루는 훅(`useFormBuilder`), 정의를 JSON Schema · UI Schema 로 바꾸는 순수 함수(`compileDefinition`),
저장한 양식을 그리는 `FormView` 가 들어 있습니다.

React 18 · 19, MUI 6 · 7, RJSF 6.

## 설치

```bash
npm install @kokotu0/rjsf-form-builder
npm install @rjsf/core @rjsf/mui @rjsf/utils @rjsf/validator-ajv8
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

## 빠른 시작

```tsx
import { useState } from "react"
import { FormBuilder, FormView, useFormBuilder } from "@kokotu0/rjsf-form-builder"

function App() {
  const builder = useFormBuilder()
  const [data, setData] = useState({})
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <FormBuilder builder={builder} />
      <FormView schema={builder.schemas.jsonSchema} uiSchema={builder.schemas.uiSchema} formData={data} onChange={setData} />
    </div>
  )
}
```

저장할 것은 `builder.form`(정의)과 `builder.schemas`(스키마)입니다. 정의를 다시 `useFormBuilder(정의)` 에 넣으면 편집을 이어 갑니다.

## 정의와 스키마

```
FormDefinition { id, nextKey, sections, rules }
  └── SectionDefinition { id, name, title, description, type, fields, ui: { grid } }
        └── FieldDefinition { id, name, kind, required, schema, ui, extra }
```

- **data 는 평평합니다.** 섹션은 배치일 뿐이고 루트 uiSchema 의 `ui:options.sections` 에
  `{ title, fields, grid, description }` 로 적습니다. `ObjectFieldTemplate` 이 이것을 읽어 섹션마다 그립니다.
  항목을 다른 섹션으로 옮겨도 값 자리는 그대로입니다.
- **키는 `field1`, `field2` … 입니다.** `nextKey` 가 다음 번호이고 지운 번호는 다시 쓰지 않습니다.
  `useFormBuilder(정의, { keyOf })` 로 키 만드는 법을 바꿀 수 있습니다.
- **`kind`** 가 항목 종류입니다: `text` `textarea` `phone` `email` `number` `integer` `date` `select` `multiselect` `checkbox`.
- **선택지는 `{ value, label }` 입니다.** 값은 처음 이름으로 정하고, 이름을 바꿔도 값은 그대로입니다.
  `select` 는 `oneOf: [{ const, title }]`, `multiselect` 는 `items.oneOf` 와 `uniqueItems` 로 바뀝니다.
- **루트 `required`** 는 항목의 `required` 에서 만듭니다.
- **`extra`** 의 `x-` 로 시작하는 설정을 항목 스키마에 그대로 싣습니다. 예: `{ "x-summary": "lead" }`.
- **전화번호** 는 입력한 그대로 둡니다. 숫자, `+`, `-`, 괄호, 점, 빈칸을 받습니다(`PHONE_PATTERN`).
- **글 길이**: `text` 는 기본 200자(최대 2000), `textarea` 는 기본 5000자(최대 20000).
- **규칙 `oneOfRequired`**: 고른 항목 중 하나는 값이 있어야 합니다. 스키마에는 루트 `anyOf`
  (규칙이 여럿이면 `allOf` 안의 `anyOf`)와 `x-rules` 로 들어갑니다. 서버는 스키마 그대로 검사하면 됩니다.
  RJSF 6 은 루트 `anyOf` 를 고르기 상자로 그리므로, `FormView` 는 `renderSchema` 로 빼고 그린 뒤
  `rulesValidate` 로 같은 규칙을 검사합니다.

## 편집기

```tsx
<FormBuilder
  builder={builder}               // 없으면 initialForm 으로 안에서 만든다
  kinds={["text", "select"]}      // 고를 수 있는 종류
  sectionTypes={["fields"]}       // 하나면 섹션 종류 고르기를 숨긴다
  showRules                       // 규칙 편집. 기본 true
  showKeys                        // 항목 키 보이기. 기본 true
  renderFieldExtra={(field, update) => <MySetting field={field} onChange={update} />}
  icons={{ add: <Plus size={16} /> }}  // 아이콘 바꾸기
/>
```

- 처음 정의에 든 항목(저장한 항목)은 종류를 바꾸지 못합니다. `useFormBuilder(정의, { locked })` 로 직접 정할 수 있습니다.
- 섹션을 지우면 항목은 옆 섹션으로 옮깁니다. 항목을 지우면 규칙에서도 빠집니다.
- 저장 전에 `checkDefinition(builder.form)` 으로 빈 제목, 겹치는 선택지, 항목이 둘 아래인 규칙을 찾습니다.

## 그리기

```tsx
const ref = useRef<FormViewHandle>(null)
<FormView ref={ref} schema={jsonSchema} uiSchema={uiSchema} formData={data} onChange={setData} extraErrors={{ field2: ["서버 오류"] }} />
ref.current?.validate() // 화면 검사. 통과하면 true
```

`FormView` 를 쓰지 않고 RJSF Form 을 직접 쓸 때는 이것을 넘깁니다:

```tsx
const { schema, rules } = renderSchema(jsonSchema)
<Form
  schema={schema}
  uiSchema={uiSchema}
  templates={customTemplates}
  widgets={customWidgets}
  customValidate={rulesValidate(rules)}
  transformErrors={transformErrors}
  experimental_defaultFormStateBehavior={FORM_STATE_BEHAVIOR}
  validator={validator}
/>
```

- `FORM_STATE_BEHAVIOR` 는 선택에 첫 선택지를 미리 넣지 않게 합니다. 넣으면 필수 검사가 걸리지 않습니다.
- `transformErrors` 는 오류를 한국어로 바꾸고 항목마다 하나만 남깁니다. `koreanErrors({ required: () => "..." })` 로 문구를 바꿉니다.

## React 없이

```ts
import { compileDefinition, checkDefinition } from "@kokotu0/rjsf-form-builder/compile"
```

`/compile` 은 React 를 가져오지 않습니다. 서버 쪽 시험이나 node 에서 씁니다.

## 0.1 에서 바뀐 것 (0.2.0)

- data 를 섹션마다 중첩하지 않고 평평하게 둡니다. 0.1 정의와 스키마는 그대로 읽지 못합니다
- `FieldDefinition.kind`, `FormDefinition.nextKey`, `FormDefinition.rules`, `FieldDefinition.extra` 를 더했습니다
- `FieldSchema` 는 `title` `description` `maxLength` `minimum` `maximum` `options` 만 둡니다. `enum` · `enumNames` 는 `options` 로 바뀌었습니다
- 항목 키를 nanoid 대신 `field<번호>` 로 매깁니다
- 루트 `required` 를 항목의 필수에서 만듭니다(0.1 은 늘 빈 목록이었습니다)
- 전화번호 위젯이 `010-0000-0000` 꼴로 바꾸지 않습니다
- 파일 항목, 날짜+시간, URL, 비밀번호 형식, 슬라이더 · 증감 숫자 위젯, 섹션 배경색 · 머리 이미지를 뺐습니다
- `FormBuilder` 의 `onChange` 가 `(definition, schemas)` 를 받습니다
- `FormView`, `RulesEditor`, `checkDefinition`, `renderSchema`, `rulesValidate`, `transformErrors` 를 더했습니다
- 화면 문구에서 그림 문자를 뺐습니다
- peer: MUI 6 · 7, RJSF 6

## 시험

```bash
npm run build && npm test
```

## 라이선스

MIT

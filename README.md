# RJSF Form Builder

[react-jsonschema-form](https://github.com/rjsf-team/react-jsonschema-form)을 위한 시각적 폼 빌더입니다. 드래그 앤 드롭을 지원합니다.

**React 18 & 19 호환**

## 기능

- 🎨 **시각적 폼 빌더** - 섹션과 필드를 드래그 앤 드롭으로 구성
- 📋 **다양한 섹션 타입** - 필드, 이미지, 설명
- 🎯 **다양한 필드 타입** - 텍스트, 숫자, 선택, 다중선택, 체크박스, 파일 업로드
- 🖼️ **이미지 섹션** - 업로드 또는 URL로 이미지 추가, 크기 조절
- 📝 **설명 섹션** - 긴 설명 텍스트 추가
- 🎨 **커스터마이즈** - 배경색, 그리드 레이아웃, 헤더 이미지, maxHeight
- 📱 **반응형** - 그리드 기반 레이아웃
- 🔧 **커스텀 위젯** - 핸드폰 번호, 증감 버튼 입력
- ⚡ **실시간 미리보기** - 변경사항 즉시 확인

## 설치

```bash
npm install @kokotu0/rjsf-form-builder

# 필수 의존성
npm install @rjsf/core @rjsf/mui @rjsf/utils @rjsf/validator-ajv8
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
```

## 빠른 시작

```tsx
import { useState } from 'react'
import { 
  FormBuilder, 
  ObjectFieldTemplate, 
  SubmitButton, 
  customWidgets 
} from '@kokotu0/rjsf-form-builder'
import Form from '@rjsf/mui'
import validator from '@rjsf/validator-ajv8'
import type { RJSFSchema, UiSchema } from '@rjsf/utils'

function App() {
  const [schema, setSchema] = useState<RJSFSchema>({})
  const [uiSchema, setUiSchema] = useState<UiSchema>({})
  const [formData, setFormData] = useState({})

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* 폼 미리보기 */}
      <Form
        schema={schema}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        onChange={(e) => setFormData(e.formData)}
        onSubmit={(e) => console.log('제출:', e.formData)}
        templates={{
          ObjectFieldTemplate,
          ButtonTemplates: { SubmitButton },
        }}
        widgets={customWidgets}
      />

      {/* 폼 빌더 */}
      <FormBuilder
        onSchemaChange={setSchema}
        onUiSchemaChange={setUiSchema}
      />
    </div>
  )
}
```

## API

### FormBuilder Props

| Prop | 타입 | 설명 |
|------|------|------|
| `onSchemaChange` | `(schema: RJSFSchema) => void` | JSON Schema 변경 시 호출 |
| `onUiSchemaChange` | `(uiSchema: UiSchema) => void` | UI Schema 변경 시 호출 |
| `onChange` | `(schemas: FormSchemas) => void` | 두 스키마 모두 전달 (deprecated) |
| `initialForm` | `FormDefinition` | 초기 폼 정의 |
| `selectedFieldId` | `string \| null` | 현재 선택된 필드 ID |
| `onFieldSelect` | `(fieldId: string \| null) => void` | 필드 선택 시 호출 |

### 커스텀 템플릿

```tsx
import { ObjectFieldTemplate, SubmitButton, customTemplates } from '@kokotu0/rjsf-form-builder'

// 개별 템플릿 사용
<Form
  templates={{
    ObjectFieldTemplate,
    ButtonTemplates: { SubmitButton },
  }}
/>

// 또는 템플릿 객체 사용
<Form templates={customTemplates} />
```

### 커스텀 위젯

```tsx
import { customWidgets, PhoneNumberWidget, UpDownWidget } from '@kokotu0/rjsf-form-builder'

// 모든 커스텀 위젯 사용
<Form widgets={customWidgets} />

// 또는 개별 위젯 사용
<Form widgets={{ phone: PhoneNumberWidget, updown: UpDownWidget }} />
```

### 섹션 타입

| 타입 | 설명 |
|------|------|
| `fields` | 표준 폼 필드 (기본값) |
| `image` | 이미지 표시 (URL 또는 업로드) |
| `description` | 텍스트 설명 섹션 |

### 필드 타입

| 타입 | 설명 |
|------|------|
| `text` | 텍스트 입력 (포맷: 이메일, URL, 날짜, 핸드폰, 비밀번호) |
| `number` | 숫자 입력 (정수/소수, range/updown 위젯) |
| `select` | 단일 선택 (드롭다운 또는 라디오) |
| `multiselect` | 다중 선택 (체크박스) |
| `checkbox` | 불린 체크박스 |
| `file` | 파일 업로드 (미리보기 지원) |

## 커스터마이즈

### 섹션 스타일링

```typescript
// 배경색 설정
section.ui.backgroundColor = "#e3f2fd"

// 헤더 이미지 설정
section.ui.headerImage = "https://example.com/header.jpg"

// 그리드 레이아웃 (1-4열)
section.ui.grid = 2

// 최대 높이 (스크롤)
section.ui.maxHeight = 400
```

### Hook 사용하기

```tsx
import { useFormBuilder } from '@kokotu0/rjsf-form-builder'

function CustomBuilder() {
  const builder = useFormBuilder()

  // 섹션 추가
  builder.addSection({ title: '새 섹션' })

  // 필드 추가
  builder.addField(sectionId)

  // 스키마 가져오기
  const { jsonSchema, uiSchema } = builder.toSchemas()

  return <div>...</div>
}
```

## 타입

```typescript
import type {
  FormDefinition,
  SectionDefinition,
  FieldDefinition,
  FormSchemas,
  FormBuilderProps,
} from '@kokotu0/rjsf-form-builder'
```

## 향후 개선 예정

- [ ] **컴포넌트 로직/UI 분리** - 현재 컴포넌트 내부에 로직과 UI가 혼합되어 있음. 추후 분리하여 커스터마이즈 용이하게 개선 예정
- [ ] **테마 커스터마이즈** - MUI 테마 외 다른 UI 라이브러리 지원
- [ ] **영상 섹션** - 비디오 임베드 지원
- [ ] **조건부 필드** - 특정 조건에 따른 필드 표시/숨김
- [ ] **필드 유효성 검사 UI** - 더 다양한 validation 룰 설정

## 라이선스

MIT

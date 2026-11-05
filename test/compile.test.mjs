/**
 * 정의 → 스키마 시험. 빌드한 `dist/compile.mjs` 를 읽는다.
 *
 *   npm run build && npm test
 */
import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PHONE_PATTERN,
  brokenRules,
  checkDefinition,
  compileDefinition,
  emptyDefinition,
  renderSchema,
  rulesValidate,
  tidyRules,
} from "../dist/compile.mjs"

const field = (name, kind, extra = {}) => ({ id: `id-${name}`, name, kind, required: false, schema: { title: name }, ui: {}, ...extra })

const definition = () => ({
  id: "f",
  nextKey: 6,
  sections: [
    { id: "s1", name: "section1", title: " 연락처 ", type: "fields", ui: { grid: 2 }, fields: [field("field1", "text", { required: true }), field("field2", "phone"), field("field3", "email")] },
    {
      id: "s2",
      name: "section2",
      title: "",
      description: "고른 것",
      type: "fields",
      ui: {},
      fields: [
        field("field4", "select", { schema: { title: "제품", options: [{ value: "센서", label: "온도 센서" }, { value: "밸브", label: "밸브" }] }, ui: { widget: "radio" } }),
        field("field5", "multiselect", { schema: { title: "용도", options: [{ value: "a", label: "A" }] }, extra: { "x-summary": "lead", note: "빠짐" } }),
      ],
    },
  ],
  rules: [{ type: "oneOfRequired", keys: ["field2", "field3"], message: " 전화나 이메일 중 하나 " }],
})

test("data 는 평평하고 섹션은 ui:options.sections 에 적는다", () => {
  const { jsonSchema, uiSchema } = compileDefinition(definition())
  assert.deepEqual(Object.keys(jsonSchema.properties), ["field1", "field2", "field3", "field4", "field5"])
  assert.deepEqual(jsonSchema.required, ["field1"])
  assert.deepEqual(uiSchema["ui:order"], ["field1", "field2", "field3", "field4", "field5"])
  assert.deepEqual(uiSchema["ui:options"].sections, [
    { title: "연락처", fields: ["field1", "field2", "field3"], grid: 2 },
    { title: "", fields: ["field4", "field5"], grid: 1, description: "고른 것" },
  ])
  assert.deepEqual(uiSchema["ui:submitButtonOptions"], { norender: true })
})

test("선택은 oneOf const/title, 여러 개 선택은 items.oneOf 와 uniqueItems", () => {
  const { jsonSchema, uiSchema } = compileDefinition(definition())
  assert.deepEqual(jsonSchema.properties.field4, { title: "제품", type: "string", oneOf: [{ const: "센서", title: "온도 센서" }, { const: "밸브", title: "밸브" }] })
  assert.deepEqual(uiSchema.field4, { "ui:widget": "radio" })
  assert.deepEqual(jsonSchema.properties.field5.items, { type: "string", oneOf: [{ const: "a", title: "A" }] })
  assert.equal(jsonSchema.properties.field5.uniqueItems, true)
  assert.deepEqual(uiSchema.field5, { "ui:widget": "checkboxes" })
})

test("x- 설정만 스키마에 싣는다", () => {
  const { jsonSchema } = compileDefinition(definition())
  assert.equal(jsonSchema.properties.field5["x-summary"], "lead")
  assert.equal(jsonSchema.properties.field5.note, undefined)
})

test("전화번호는 입력한 그대로 받는다", () => {
  const { jsonSchema, uiSchema } = compileDefinition(definition())
  assert.equal(jsonSchema.properties.field2.pattern, PHONE_PATTERN)
  assert.deepEqual(uiSchema.field2, { "ui:inputType": "tel" })
  const re = new RegExp(PHONE_PATTERN)
  for (const ok of ["010-1234-5678", "+82 10 1234 5678", "(02) 123.4567"]) assert.ok(re.test(ok), ok)
  for (const bad of ["010-1234-abcd", "12"]) assert.ok(!re.test(bad), bad)
})

test("글 길이는 기본값과 상한이 있다", () => {
  const d = definition()
  d.sections[0].fields[0].schema.maxLength = 99999
  const { jsonSchema } = compileDefinition(d)
  assert.equal(jsonSchema.properties.field1.maxLength, 2000)
  assert.equal(compileDefinition(definition()).jsonSchema.properties.field1.maxLength, 200)
})

test("규칙 하나는 루트 anyOf, 여럿은 allOf", () => {
  const one = compileDefinition(definition()).jsonSchema
  assert.deepEqual(one.anyOf, [{ required: ["field2"] }, { required: ["field3"] }])
  assert.deepEqual(one["x-rules"], [{ oneOfRequired: ["field2", "field3"], message: "전화나 이메일 중 하나" }])
  const d = definition()
  d.rules.push({ type: "oneOfRequired", keys: ["field1", "field4"], message: "둘" })
  const two = compileDefinition(d).jsonSchema
  assert.equal(two.anyOf, undefined)
  assert.equal(two.allOf.length, 2)
})

test("그릴 때는 규칙을 빼고 x-rules 로 검사한다", () => {
  const { jsonSchema } = compileDefinition(definition())
  const { schema, rules } = renderSchema(jsonSchema)
  assert.equal(schema.anyOf, undefined)
  assert.equal(schema["x-rules"], undefined)
  assert.equal(rules.length, 1)
  assert.deepEqual(brokenRules(rules, { field1: "a" }), [{ keys: ["field2", "field3"], message: "전화나 이메일 중 하나" }])
  assert.deepEqual(brokenRules(rules, { field3: "a@b.co" }), [])
  assert.deepEqual(brokenRules(rules, { field2: "", field3: [] }).length, 1)

  const added = []
  const errors = { field2: { addError: (m) => added.push(["field2", m]) }, field3: { addError: (m) => added.push(["field3", m]) } }
  rulesValidate(rules)({}, errors)
  assert.deepEqual(added, [["field2", "전화나 이메일 중 하나"], ["field3", "전화나 이메일 중 하나"]])
})

test("이미지 · 설명 섹션은 항목 없이 배치에만 든다", () => {
  const d = definition()
  d.sections.splice(1, 0, { id: "i", name: "img", title: "안내", type: "image", fields: [], content: { url: "https://x/y.png", alt: "그림" }, ui: { grid: 2 } })
  d.sections.push({ id: "t", name: "txt", title: "끝", description: "고맙습니다", type: "description", fields: [], ui: {} })
  const { uiSchema } = compileDefinition(d)
  const sections = uiSchema["ui:options"].sections
  assert.deepEqual(sections[1], { type: "image", title: "안내", fields: [], grid: 2, src: "https://x/y.png", alt: "그림" })
  assert.deepEqual(sections[3], { type: "description", title: "끝", fields: [], grid: 1, description: "고맙습니다" })
})

test("저장 전 검사", () => {
  assert.deepEqual(checkDefinition(definition()), [])
  assert.deepEqual(checkDefinition(emptyDefinition()).map((p) => p.message), ["항목을 하나 이상 넣어 주세요."])
  const d = definition()
  d.sections[1].fields[0].schema.options.push({ value: "센서", label: "또 센서" })
  d.rules.push({ type: "oneOfRequired", keys: ["field1"], message: "" })
  const messages = checkDefinition(d).map((p) => p.message)
  assert.ok(messages.includes("'제품' 의 선택지가 겹칩니다."))
  assert.ok(messages.includes("규칙마다 항목을 둘 이상 고르세요."))
  assert.ok(messages.includes("규칙의 안내 문구를 넣어 주세요."))
})

test("지운 항목은 규칙에서 빠진다", () => {
  const d = definition()
  d.sections[0].fields = d.sections[0].fields.filter((f) => f.name !== "field3")
  assert.deepEqual(tidyRules(d)[0].keys, ["field2"])
})

import { useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { Alert, Box, Button, CssBaseline, Paper, Stack, Tab, Tabs, Typography } from "@mui/material"
import { FormBuilder, FormView, checkDefinition, emptyDefinition, useFormBuilder, type FormDefinition, type FormViewHandle } from "@kokotu0/rjsf-form-builder"

const STORE = "rjsf-form-builder:playground"

/** 처음 열 때 쓰는 보기 양식 */
const SAMPLE: FormDefinition = {
  id: "sample",
  nextKey: 6,
  sections: [
    {
      id: "s1",
      name: "section1",
      title: "연락처",
      type: "fields",
      ui: { grid: 2 },
      fields: [
        { id: "f1", name: "field1", kind: "text", required: true, schema: { title: "이름" }, ui: {} },
        { id: "f2", name: "field2", kind: "phone", required: false, schema: { title: "전화번호" }, ui: { placeholder: "010-1234-5678" } },
        { id: "f3", name: "field3", kind: "email", required: false, schema: { title: "이메일" }, ui: {} },
      ],
    },
    {
      id: "s2",
      name: "section2",
      title: "문의",
      type: "fields",
      ui: { grid: 1 },
      fields: [
        {
          id: "f4",
          name: "field4",
          kind: "select",
          required: true,
          schema: { title: "제품", options: [{ value: "센서", label: "온도 센서" }, { value: "밸브", label: "밸브" }] },
          ui: { widget: "radio" },
        },
        { id: "f5", name: "field5", kind: "textarea", required: false, schema: { title: "내용", maxLength: 1000 }, ui: {} },
      ],
    },
  ],
  rules: [{ type: "oneOfRequired", keys: ["field2", "field3"], message: "전화번호나 이메일 중 하나는 입력해 주세요." }],
}

function loadSaved(): FormDefinition | undefined {
  try {
    const text = localStorage.getItem(STORE)
    return text ? (JSON.parse(text) as FormDefinition) : undefined
  } catch {
    return undefined
  }
}

const Json = ({ value }: { value: unknown }) => (
  <Box component="pre" sx={{ m: 0, fontSize: 12, overflow: "auto", maxHeight: "70vh" }}>
    {JSON.stringify(value, null, 2)}
  </Box>
)

/** 저장본으로 시작하면 그 항목은 잠긴다. 저장하면 다시 열 때 잠긴다 */
function Playground({ initial, onSave, onStart }: { initial?: FormDefinition; onSave: (form: FormDefinition) => void; onStart: (form?: FormDefinition) => void }) {
  const builder = useFormBuilder(initial)
  const [data, setData] = useState<Record<string, unknown>>({})
  const [tab, setTab] = useState(0)
  const [checked, setChecked] = useState<boolean | null>(null)
  const view = useRef<FormViewHandle>(null)
  const problems = checkDefinition(builder.form)

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mr: 2 }}>
          rjsf-form-builder 시험장
        </Typography>
        <Button size="small" variant="contained" disableElevation disabled={problems.length > 0} onClick={() => onSave(builder.form)}>
          저장
        </Button>
        <Button size="small" onClick={() => onStart(SAMPLE)}>
          보기 양식으로
        </Button>
        <Button size="small" onClick={() => onStart(emptyDefinition())}>
          빈 양식으로
        </Button>
        <Typography variant="body2" color="text.secondary">
          잠긴 항목 {builder.locked.size}개
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, alignItems: "start" }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable">
            <Tab label="미리보기" />
            <Tab label="data" />
            <Tab label="JSON Schema" />
            <Tab label="UI Schema" />
            <Tab label="정의" />
          </Tabs>
          {tab === 0 && (
            <>
              <FormView ref={view} schema={builder.schemas.jsonSchema} uiSchema={builder.schemas.uiSchema} formData={data} onChange={setData} />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <Button size="small" variant="outlined" onClick={() => setChecked(view.current?.validate() ?? false)}>
                  검사
                </Button>
                <Button size="small" onClick={() => (setData({}), setChecked(null))}>
                  입력 비우기
                </Button>
                {checked !== null && (
                  <Typography variant="body2" color={checked ? "success.main" : "error.main"}>
                    {checked ? "통과" : "오류가 있습니다"}
                  </Typography>
                )}
              </Stack>
            </>
          )}
          {tab === 1 && <Json value={data} />}
          {tab === 2 && <Json value={builder.schemas.jsonSchema} />}
          {tab === 3 && <Json value={builder.schemas.uiSchema} />}
          {tab === 4 && <Json value={builder.form} />}
          {problems.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {problems.map((p, i) => (
                <div key={i}>{p.message}</div>
              ))}
            </Alert>
          )}
        </Paper>
        <FormBuilder builder={builder} />
      </Box>
    </Box>
  )
}

function App() {
  const [start, setStart] = useState(() => ({ form: loadSaved() ?? SAMPLE, n: 0 }))
  return (
    <Playground
      key={start.n}
      initial={start.form}
      onSave={(form) => {
        localStorage.setItem(STORE, JSON.stringify(form))
        setStart((s) => ({ form, n: s.n + 1 }))
      }}
      onStart={(form) => {
        localStorage.removeItem(STORE)
        setStart((s) => ({ form: form ?? SAMPLE, n: s.n + 1 }))
      }}
    />
  )
}

createRoot(document.getElementById("root")!).render(
  <>
    <CssBaseline />
    <App />
  </>,
)

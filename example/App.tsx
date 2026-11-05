import { useState } from "react"
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material"
import { FormBuilder, FormView, checkDefinition, useFormBuilder } from "@kokotu0/rjsf-form-builder"

/**
 * 예제. 왼쪽은 미리보기와 스키마, 오른쪽은 편집기.
 */
export default function App() {
  const builder = useFormBuilder()
  const [data, setData] = useState<Record<string, unknown>>({})
  const [tab, setTab] = useState(0)
  const problems = checkDefinition(builder.form)

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, p: 2 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="미리보기" />
          <Tab label="JSON Schema" />
          <Tab label="UI Schema" />
          <Tab label="정의" />
        </Tabs>
        {tab === 0 && <FormView schema={builder.schemas.jsonSchema} uiSchema={builder.schemas.uiSchema} formData={data} onChange={setData} />}
        {tab === 1 && <pre>{JSON.stringify(builder.schemas.jsonSchema, null, 2)}</pre>}
        {tab === 2 && <pre>{JSON.stringify(builder.schemas.uiSchema, null, 2)}</pre>}
        {tab === 3 && <pre>{JSON.stringify(builder.form, null, 2)}</pre>}
        {problems.map((p, i) => (
          <Typography key={i} variant="body2" color="error">
            {p.message}
          </Typography>
        ))}
      </Paper>
      <FormBuilder builder={builder} />
    </Box>
  )
}

import { useState, useCallback } from "react"
import { 
  FormBuilder, 
  ObjectFieldTemplate, 
  SubmitButton, 
  customWidgets 
} from "@kokotu0/rjsf-form-builder"
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material"
import type { RJSFSchema, UiSchema } from "@rjsf/utils"
import type { IChangeEvent } from "@rjsf/core"
import Form from "@rjsf/mui"
import validator from "@rjsf/validator-ajv8"

/**
 * 폼 빌더 예제
 * 
 * 좌측: 폼 미리보기 / 스키마 뷰어
 * 우측: 폼 빌더
 */
export default function App() {
  // 스키마 상태
  const [schema, setSchema] = useState<RJSFSchema>({})
  const [uiSchema, setUiSchema] = useState<UiSchema>({})
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState<unknown>({})
  
  // UI 상태
  const [tab, setTab] = useState(0)

  // 스키마 변경 콜백
  const handleSchemaChange = useCallback((newSchema: RJSFSchema) => {
    setSchema(newSchema)
  }, [])

  const handleUiSchemaChange = useCallback((newUiSchema: UiSchema) => {
    setUiSchema(newUiSchema)
  }, [])

  // 폼 데이터 변경 콜백
  const handleFormChange = useCallback((e: IChangeEvent) => {
    setFormData(e.formData)
  }, [])

  // 폼 제출 콜백
  const handleSubmit = useCallback((e: IChangeEvent) => {
    console.log("Form submitted:", e.formData)
    alert(JSON.stringify(e.formData, null, 2))
  }, [])

  return (
    <Box
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gap={2}
      height="100vh"
      p={2}
    >
      {/* 좌측: 폼 미리보기 / 스키마 뷰어 (탭) */}
      <Paper
        variant="outlined"
        sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
        >
          <Tab label="폼 미리보기" />
          <Tab label="스키마 뷰어" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {tab === 0 && (
            <Form
              schema={schema}
              uiSchema={uiSchema}
              formData={formData}
              validator={validator}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              templates={{
                ObjectFieldTemplate,
                ButtonTemplates: { SubmitButton },
              }}
              widgets={customWidgets}
            />
          )}
          {tab === 1 && (
            <Box component="pre" sx={{ fontSize: 12, overflow: "auto" }}>
              {JSON.stringify({ schema, uiSchema, formData }, null, 2)}
            </Box>
          )}
        </Box>
      </Paper>

      {/* 우측: 폼 빌더 */}
      <Paper
        variant="outlined"
        sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            폼 빌더
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <FormBuilder
            onSchemaChange={handleSchemaChange}
            onUiSchemaChange={handleUiSchemaChange}
          />
        </Box>
      </Paper>
    </Box>
  )
}


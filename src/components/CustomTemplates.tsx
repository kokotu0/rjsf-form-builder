import { Box, Button, Typography } from "@mui/material"
import type { ObjectFieldTemplateProps, SubmitButtonProps } from "@rjsf/utils"
import { getSubmitButtonOptions } from "@rjsf/utils"

import type { LayoutSection } from "../types"

const columns = (grid: number | undefined) => Math.max(1, Math.min(3, grid ?? 1))

function Grid({ grid, children }: { grid?: number; children: React.ReactNode }) {
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns(grid)}, minmax(0, 1fr))` }, columnGap: 2, rowGap: 2 }}>{children}</Box>
}

function Heading({ title, description }: { title?: string; description?: string }) {
  if (!title && !description) return null
  return (
    <>
      {title && (
        <Typography variant="subtitle2" component="h3" sx={{ mb: description ? 0.5 : 1.5 }}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}>
          {description}
        </Typography>
      )}
    </>
  )
}

/**
 * 루트 uiSchema 의 `ui:options.sections` 를 읽어 섹션마다 제목, 설명, 칸 나눔(1~3)으로 그린다.
 * data 는 평평하고 섹션은 배치일 뿐이다. 섹션에 없는 항목은 끝에 그린다.
 * sections 가 없으면 받은 순서대로 그린다(0.1 의 섹션마다 중첩한 data 도 `ui:options.grid` 로 그린다).
 */
export const ObjectFieldTemplate = (props: ObjectFieldTemplateProps) => {
  const { title, description, properties, uiSchema } = props
  const options = uiSchema?.["ui:options"] as { sections?: LayoutSection[]; grid?: number } | undefined
  const sections = options?.sections

  if (!sections) {
    return (
      <Box sx={{ mb: 2 }}>
        <Heading title={typeof title === "string" ? title : undefined} description={typeof description === "string" ? description : undefined} />
        <Grid grid={options?.grid}>
          {properties.map((p) => (
            <Box key={p.name}>{p.content}</Box>
          ))}
        </Grid>
      </Box>
    )
  }

  const byName = new Map(properties.map((p) => [p.name, p]))
  const placed = new Set(sections.flatMap((s) => s.fields))
  const rest = properties.filter((p) => !placed.has(p.name))
  return (
    <Box>
      {sections.map((s, i) => {
        if (s.type === "image") {
          if (!s.src) return null
          return (
            <Box key={i} sx={{ mb: 3 }}>
              <Heading title={s.title} />
              <Box component="img" src={s.src} alt={s.alt ?? ""} sx={{ display: "block", maxWidth: `${100 / columns(s.grid)}%`, width: "100%", borderRadius: 1 }} />
            </Box>
          )
        }
        if (s.type === "description") {
          return (
            <Box key={i} sx={{ mb: 3 }}>
              <Heading title={s.title} description={s.description} />
            </Box>
          )
        }
        const shown = s.fields.filter((f) => byName.has(f) && !byName.get(f)!.hidden)
        if (shown.length === 0) return null
        return (
          <Box key={i} sx={{ mb: 3 }}>
            <Heading title={s.title} description={s.description} />
            <Grid grid={s.grid}>
              {shown.map((f) => (
                <Box key={f}>{byName.get(f)!.content}</Box>
              ))}
            </Grid>
          </Box>
        )
      })}
      {rest.length > 0 && (
        <Grid>
          {rest.map((p) => (
            <Box key={p.name}>{p.content}</Box>
          ))}
        </Grid>
      )}
    </Box>
  )
}

/** 제출 단추. `ui:submitButtonOptions.norender` 면 그리지 않는다 */
export const SubmitButton = (props: SubmitButtonProps) => {
  const { norender, submitText } = getSubmitButtonOptions(props.uiSchema)
  if (norender) return null
  return (
    <Button type="submit" variant="contained" disableElevation sx={{ mt: 1 }}>
      {submitText && submitText !== "Submit" ? submitText : "제출"}
    </Button>
  )
}

export const customTemplates = {
  ObjectFieldTemplate,
  ButtonTemplates: { SubmitButton },
}

export default customTemplates

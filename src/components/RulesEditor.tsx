import { Box, Button, Checkbox, IconButton, ListItemText, MenuItem, Stack, TextField, Typography } from "@mui/material"

import type { FieldDefinition, FormRule } from "../types"
import { useIcons } from "./icons"

export interface RulesEditorProps {
  rules: FormRule[]
  fields: FieldDefinition[]
  onChange: (rules: FormRule[]) => void
}

export const DEFAULT_RULE_MESSAGE = "이 중 하나는 입력해 주세요."

const titleOf = (fields: FieldDefinition[], key: string) => fields.find((f) => f.name === key)?.schema.title.trim() || key

/** '여럿 중 하나는 필수' 규칙. 항목을 둘 이상 고른다 */
export const RulesEditor = ({ rules, fields, onChange }: RulesEditorProps) => {
  const icons = useIcons()
  const set = (index: number, patch: Partial<FormRule>) => onChange(rules.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  return (
    <Box>
      <Typography variant="subtitle2">규칙</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        고른 항목 중 하나는 꼭 입력해야 합니다. 예: 전화번호나 이메일 중 하나.
      </Typography>
      <Stack spacing={1}>
        {rules.map((rule, i) => (
          <Stack key={i} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.25, bgcolor: "background.paper" }}>
            <TextField
              select
              size="small"
              label="항목"
              value={rule.keys}
              onChange={(e) => set(i, { keys: typeof e.target.value === "string" ? e.target.value.split(",") : (e.target.value as unknown as string[]) })}
              error={rule.keys.length < 2}
              helperText={rule.keys.length < 2 ? "항목을 둘 이상 고르세요." : undefined}
              sx={{ flex: 1, minWidth: 0 }}
              slotProps={{ select: { multiple: true, renderValue: (value) => (value as string[]).map((k) => titleOf(fields, k)).join(", ") } }}
            >
              {fields.map((f) => (
                <MenuItem key={f.name} value={f.name} dense>
                  <Checkbox size="small" checked={rule.keys.includes(f.name)} sx={{ p: 0.5, mr: 1 }} />
                  <ListItemText primary={f.schema.title.trim() || f.name} />
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="안내 문구" value={rule.message} onChange={(e) => set(i, { message: e.target.value })} error={!rule.message.trim()} sx={{ flex: 1 }} />
            <IconButton size="small" aria-label="규칙 지우기" onClick={() => onChange(rules.filter((_, j) => j !== i))} sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}>
              {icons.remove}
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button size="small" startIcon={icons.add} disabled={fields.length < 2 || rules.length >= 10} onClick={() => onChange([...rules, { type: "oneOfRequired", keys: [], message: DEFAULT_RULE_MESSAGE }])} sx={{ mt: 1 }}>
        규칙 추가
      </Button>
    </Box>
  )
}

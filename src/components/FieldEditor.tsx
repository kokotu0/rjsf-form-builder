import { useState, type ReactNode } from "react"
import { Box, Button, Checkbox, Collapse, FormControlLabel, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material"

import { hasOptions } from "../compile"
import { KIND_LABELS, SELECT_DISPLAY_LABELS, TYPED_KINDS } from "../constants"
import type { FieldDefinition, FieldKind, FieldOption } from "../types"
import { useIcons } from "./icons"

export interface FieldEditorProps {
  field: FieldDefinition
  sectionId: string
  isFirst: boolean
  isLast: boolean
  /** 저장한 항목. 종류를 바꾸지 못한다 */
  locked?: boolean
  kinds: FieldKind[]
  showKey?: boolean
  isSelected?: boolean
  defaultExpanded?: boolean
  onSelect?: () => void
  onUpdate: (sectionId: string, fieldId: string, updates: Partial<FieldDefinition>) => void
  onKind: (fieldId: string, kind: FieldKind) => void
  onRemove: (sectionId: string, fieldId: string) => void
  onMove: (sectionId: string, fieldId: string, direction: "up" | "down") => void
  renderExtra?: (field: FieldDefinition, update: (updates: Partial<FieldDefinition>) => void) => ReactNode
  dragHandleProps?: Record<string, unknown>
}

const numberOrUndefined = (text: string) => (text.trim() === "" || isNaN(Number(text)) ? undefined : Number(text))

function OptionsEditor({ options, onChange }: { options: FieldOption[]; onChange: (options: FieldOption[]) => void }) {
  const icons = useIcons()
  const [draft, setDraft] = useState("")
  const taken = options.some((o) => o.value === draft.trim())
  const add = () => {
    const label = draft.trim()
    if (!label || taken) return
    onChange([...options, { value: label, label }])
    setDraft("")
  }
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        선택지
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 0.5 }}>
        {options.map((o, i) => (
          <Stack key={`${o.value}-${i}`} direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              value={o.label}
              onChange={(e) => onChange(options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              sx={{ flex: 1 }}
              slotProps={{ htmlInput: { "aria-label": `선택지 ${i + 1}` } }}
              helperText={o.label.trim() !== o.value ? `저장하는 값: ${o.value}` : undefined}
            />
            <Tooltip title="선택지 빼기">
              <span>
                <IconButton size="small" aria-label="선택지 빼기" disabled={options.length <= 1} onClick={() => onChange(options.filter((_, j) => j !== i))}>
                  {icons.remove}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ))}
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            size="small"
            placeholder="선택지 이름"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault()
                add()
              }
            }}
            error={taken}
            helperText={taken ? "같은 선택지가 있습니다." : undefined}
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { "aria-label": "새 선택지" } }}
          />
          <Button size="small" variant="outlined" onClick={add} disabled={!draft.trim() || taken} sx={{ height: 40 }}>
            추가
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}

/** 항목 하나. 머리 줄을 누르면 펼치고 접는다 */
export const FieldEditor = ({
  field,
  sectionId,
  isFirst,
  isLast,
  locked,
  kinds,
  showKey = true,
  isSelected,
  defaultExpanded = false,
  onSelect,
  onUpdate,
  onKind,
  onRemove,
  onMove,
  renderExtra,
  dragHandleProps,
}: FieldEditorProps) => {
  const icons = useIcons()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const update = (updates: Partial<FieldDefinition>) => onUpdate(sectionId, field.id, updates)
  const setSchema = (patch: Partial<FieldDefinition["schema"]>) => update({ schema: { ...field.schema, ...patch } })
  const setUi = (patch: Partial<FieldDefinition["ui"]>) => update({ ui: { ...field.ui, ...patch } })
  const kind = field.kind

  return (
    <Box
      onClick={onSelect}
      sx={{ border: 1, borderColor: isSelected ? "primary.main" : "divider", borderRadius: 1, bgcolor: "background.paper", mb: 1, overflow: "hidden" }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ pl: 0.5, pr: 0.5, py: 0.5, minHeight: 44 }}>
        {dragHandleProps && (
          <Box {...dragHandleProps} aria-label="끌어서 옮기기" sx={{ display: "flex", color: "text.disabled", cursor: "grab", p: 0.5 }} onClick={(e) => e.stopPropagation()}>
            {icons.drag}
          </Box>
        )}
        <Box
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setExpanded((v) => !v))}
          sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1, cursor: "pointer", py: 0.5, pl: dragHandleProps ? 0 : 1 }}
        >
          <Typography variant="body2" fontWeight={500} noWrap sx={{ minWidth: 0 }}>
            {field.schema.title.trim() || "제목 없음"}
          </Typography>
          {field.required && (
            <Typography variant="caption" color="error.main" sx={{ flexShrink: 0 }}>
              필수
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" noWrap sx={{ flexShrink: 0 }}>
            {KIND_LABELS[kind]}
          </Typography>
          {showKey && (
            <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace", flexShrink: 0 }}>
              {field.name}
            </Typography>
          )}
        </Box>
        <IconButton size="small" aria-label="위로" disabled={isFirst} onClick={(e) => (e.stopPropagation(), onMove(sectionId, field.id, "up"))}>
          {icons.up}
        </IconButton>
        <IconButton size="small" aria-label="아래로" disabled={isLast} onClick={(e) => (e.stopPropagation(), onMove(sectionId, field.id, "down"))}>
          {icons.down}
        </IconButton>
        <IconButton size="small" aria-label="항목 지우기" onClick={(e) => (e.stopPropagation(), onRemove(sectionId, field.id))}>
          {icons.remove}
        </IconButton>
        <IconButton size="small" aria-label={expanded ? "접기" : "펼치기"} onClick={(e) => (e.stopPropagation(), setExpanded((v) => !v))}>
          {expanded ? icons.collapse : icons.expand}
        </IconButton>
      </Stack>

      <Collapse in={expanded} unmountOnExit>
        <Stack spacing={1.5} sx={{ px: 1.5, pb: 1.5, pt: 1, borderTop: 1, borderColor: "divider" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField size="small" label="제목" value={field.schema.title} onChange={(e) => setSchema({ title: e.target.value })} sx={{ flex: 2 }} />
            <TextField
              select
              size="small"
              label="종류"
              value={kind}
              onChange={(e) => onKind(field.id, e.target.value as FieldKind)}
              disabled={locked}
              helperText={locked ? "저장한 항목은 종류를 바꿀 수 없습니다." : undefined}
              sx={{ flex: 1, minWidth: 140 }}
            >
              {(kinds.includes(kind) ? kinds : [kind, ...kinds]).map((k) => (
                <MenuItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <TextField size="small" label="설명" value={field.schema.description ?? ""} onChange={(e) => setSchema({ description: e.target.value || undefined })} />

          {TYPED_KINDS.includes(kind) && (
            <TextField size="small" label="안내 문구" value={field.ui.placeholder ?? ""} onChange={(e) => setUi({ placeholder: e.target.value || undefined })} />
          )}

          {(kind === "text" || kind === "textarea") && (
            <TextField
              size="small"
              type="number"
              label="최대 글자 수"
              value={field.schema.maxLength ?? ""}
              placeholder={kind === "text" ? "200" : "5000"}
              onChange={(e) => setSchema({ maxLength: numberOrUndefined(e.target.value) })}
              slotProps={{ htmlInput: { min: 1, max: kind === "text" ? 2000 : 20000 } }}
              sx={{ maxWidth: 180 }}
            />
          )}

          {(kind === "number" || kind === "integer") && (
            <Stack direction="row" spacing={1}>
              <TextField size="small" type="number" label="최솟값" value={field.schema.minimum ?? ""} onChange={(e) => setSchema({ minimum: numberOrUndefined(e.target.value) })} sx={{ flex: 1 }} />
              <TextField size="small" type="number" label="최댓값" value={field.schema.maximum ?? ""} onChange={(e) => setSchema({ maximum: numberOrUndefined(e.target.value) })} sx={{ flex: 1 }} />
            </Stack>
          )}

          {kind === "select" && (
            <TextField select size="small" label="보이는 모양" value={field.ui.widget === "radio" ? "radio" : "select"} onChange={(e) => setUi({ widget: e.target.value as "select" | "radio" })} sx={{ maxWidth: 200 }}>
              {(["select", "radio"] as const).map((w) => (
                <MenuItem key={w} value={w}>
                  {SELECT_DISPLAY_LABELS[w]}
                </MenuItem>
              ))}
            </TextField>
          )}

          {hasOptions(kind) && <OptionsEditor options={field.schema.options ?? []} onChange={(options) => setSchema({ options })} />}

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControlLabel control={<Checkbox size="small" checked={field.required} onChange={(e) => update({ required: e.target.checked })} />} label={<Typography variant="body2">필수</Typography>} />
            {renderExtra?.(field, update)}
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  )
}

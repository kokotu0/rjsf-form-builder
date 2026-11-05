import { useState, type ReactNode } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Box, Button, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material"

import { GRID_CHOICES, SECTION_TYPE_LABELS } from "../constants"
import type { FieldDefinition, FieldKind, ImageContent, SectionDefinition, SectionType } from "../types"
import { ImageModal } from "./ImageModal"
import { SortableFieldEditor } from "./SortableFieldEditor"
import { useIcons } from "./icons"

export interface SectionEditorProps {
  section: SectionDefinition
  isFirst: boolean
  isLast: boolean
  /** 섹션이 하나뿐이면 지우지 못한다 */
  canRemove: boolean
  kinds: FieldKind[]
  sectionTypes: SectionType[]
  locked: ReadonlyMap<string, FieldKind>
  showKeys?: boolean
  /** 막 더한 항목. 펼친 채로 보인다 */
  openFieldId?: string | null
  selectedFieldId?: string | null
  onFieldSelect?: (fieldId: string | null) => void
  onUpdate: (sectionId: string, updates: Partial<SectionDefinition>) => void
  onRemove: (sectionId: string) => void
  onMove: (sectionId: string, direction: "up" | "down") => void
  onAddField: (sectionId: string) => void
  onUpdateField: (sectionId: string, fieldId: string, updates: Partial<FieldDefinition>) => void
  onKind: (fieldId: string, kind: FieldKind) => void
  onRemoveField: (sectionId: string, fieldId: string) => void
  onMoveField: (sectionId: string, fieldId: string, direction: "up" | "down") => void
  onReorderField: (sectionId: string, activeId: string, overId: string) => void
  renderFieldExtra?: (field: FieldDefinition, update: (updates: Partial<FieldDefinition>) => void) => ReactNode
  /** 섹션 끝에서 넘어갈 곳이 있는지. 첫 항목의 위, 끝 항목의 아래 단추에 쓴다 */
  hasPrevFields?: boolean
  hasNextFields?: boolean
  dragHandleProps?: Record<string, unknown>
}

export const SectionEditor = ({
  section,
  isFirst,
  isLast,
  canRemove,
  kinds,
  sectionTypes,
  locked,
  showKeys,
  openFieldId,
  selectedFieldId,
  onFieldSelect,
  onUpdate,
  onRemove,
  onMove,
  onAddField,
  onUpdateField,
  onKind,
  onRemoveField,
  onMoveField,
  onReorderField,
  renderFieldExtra,
  hasPrevFields,
  hasNextFields,
  dragHandleProps,
}: SectionEditorProps) => {
  const icons = useIcons()
  const [imageOpen, setImageOpen] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) onReorderField(section.id, String(active.id), String(over.id))
  }
  const image = section.content as ImageContent | undefined
  const imageSrc = image?.url || image?.file

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, bgcolor: "background.default", p: 1.5, mb: 2 }}>
      <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mb: 1 }}>
        {dragHandleProps && (
          <Box {...dragHandleProps} aria-label="섹션 끌어서 옮기기" sx={{ display: "flex", color: "text.disabled", cursor: "grab", p: 0.5, mt: 0.75 }}>
            {icons.drag}
          </Box>
        )}
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {sectionTypes.length > 1 && (
              <TextField select size="small" label="섹션 종류" value={section.type} onChange={(e) => onUpdate(section.id, { type: e.target.value as SectionType })} sx={{ minWidth: 110 }}>
                {sectionTypes.map((t) => (
                  <MenuItem key={t} value={t}>
                    {SECTION_TYPE_LABELS[t]}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField size="small" label="섹션 제목" placeholder="비워 두면 제목 없이 보입니다" value={section.title} onChange={(e) => onUpdate(section.id, { title: e.target.value })} sx={{ flex: 1 }} />
            {section.type !== "description" && (
              <TextField
                select
                size="small"
                label={section.type === "image" ? "크기" : "한 줄에"}
                value={section.ui.grid ?? 1}
                onChange={(e) => onUpdate(section.id, { ui: { ...section.ui, grid: Number(e.target.value) } })}
                sx={{ minWidth: 100 }}
              >
                {GRID_CHOICES.map((n) => (
                  <MenuItem key={n} value={n}>
                    {section.type === "image" ? (n === 1 ? "전체" : `1/${n}`) : `${n}개`}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
          {section.type !== "image" && (
            <TextField
              size="small"
              label={section.type === "description" ? "설명 글" : "섹션 설명"}
              multiline={section.type === "description"}
              minRows={section.type === "description" ? 3 : undefined}
              value={section.description ?? ""}
              onChange={(e) => onUpdate(section.id, { description: e.target.value || undefined })}
            />
          )}
        </Stack>
        <IconButton size="small" aria-label="섹션 위로" disabled={isFirst} onClick={() => onMove(section.id, "up")}>
          {icons.up}
        </IconButton>
        <IconButton size="small" aria-label="섹션 아래로" disabled={isLast} onClick={() => onMove(section.id, "down")}>
          {icons.down}
        </IconButton>
        <IconButton size="small" aria-label="섹션 지우기" disabled={!canRemove} onClick={() => onRemove(section.id)}>
          {icons.remove}
        </IconButton>
      </Stack>

      {section.type === "fields" && (
        <>
          {section.fields.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              항목이 없습니다.
            </Typography>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={section.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                {section.fields.map((field, index) => (
                  <SortableFieldEditor
                    key={field.id}
                    field={field}
                    sectionId={section.id}
                    isFirst={index === 0 && !hasPrevFields}
                    isLast={index === section.fields.length - 1 && !hasNextFields}
                    locked={locked.has(field.name)}
                    kinds={kinds}
                    showKey={showKeys}
                    defaultExpanded={field.id === openFieldId}
                    isSelected={selectedFieldId === field.id}
                    onSelect={onFieldSelect ? () => onFieldSelect(field.id) : undefined}
                    onUpdate={onUpdateField}
                    onKind={onKind}
                    onRemove={onRemoveField}
                    onMove={onMoveField}
                    renderExtra={renderFieldExtra}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          <Button size="small" startIcon={icons.add} onClick={() => onAddField(section.id)}>
            항목 추가
          </Button>
        </>
      )}

      {section.type === "image" && (
        <Box>
          {imageSrc && <Box component="img" src={imageSrc} alt={image?.alt ?? ""} sx={{ display: "block", maxWidth: "100%", maxHeight: 200, borderRadius: 1, mb: 1 }} />}
          <Button size="small" variant="outlined" onClick={() => setImageOpen(true)}>
            {imageSrc ? "이미지 바꾸기" : "이미지 넣기"}
          </Button>
          <ImageModal open={imageOpen} onClose={() => setImageOpen(false)} onSave={(content) => onUpdate(section.id, { content })} initialContent={image} />
        </Box>
      )}
    </Box>
  )
}

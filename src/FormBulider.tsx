import { useEffect, useMemo, useRef, useState } from "react"
import { Box, Button, Stack } from "@mui/material"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { FIELD_KINDS } from "./compile"
import { useFormBuilder } from "./useFormBuilder"
import { RulesEditor, SortableSectionEditor } from "./components"
import { DEFAULT_ICONS, IconsContext } from "./components/icons"
import type { FormBuilderProps, SectionType } from "./types"

const ALL_SECTION_TYPES: SectionType[] = ["fields", "image", "description"]

/**
 * 양식 편집기. 섹션 → 항목 → 규칙 순으로 그린다.
 *
 * - `builder` 를 넘기면 그 훅을 그린다. 정의 · 스키마는 훅에서 읽는다
 * - 넘기지 않으면 `initialForm` 으로 안에서 만들고 `onChange` · `onSchemaChange` · `onUiSchemaChange` 로 알린다
 */
const FormBuilder = ({
  builder: outer,
  initialForm,
  keyOf,
  locked,
  onChange,
  onSchemaChange,
  onUiSchemaChange,
  kinds = FIELD_KINDS,
  sectionTypes = ALL_SECTION_TYPES,
  showRules = true,
  showKeys = true,
  renderFieldExtra,
  icons,
  selectedFieldId,
  onFieldSelect,
}: FormBuilderProps) => {
  const own = useFormBuilder(initialForm, { keyOf, locked, onChange })
  const builder = outer ?? own
  const { form, schemas } = builder
  const [openFieldId, setOpenFieldId] = useState<string | null>(null)

  const listeners = useRef({ onSchemaChange, onUiSchemaChange })
  useEffect(() => {
    listeners.current = { onSchemaChange, onUiSchemaChange }
  })
  useEffect(() => {
    listeners.current.onSchemaChange?.(schemas.jsonSchema)
    listeners.current.onUiSchemaChange?.(schemas.uiSchema)
  }, [schemas])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) builder.reorderSection(String(active.id), String(over.id))
  }

  const mergedIcons = useMemo(() => ({ ...DEFAULT_ICONS, ...icons }), [icons])
  const fieldSections = form.sections.map((s) => s.type === "fields")
  // 항목 이름으로 고른 것도 받는다(미리보기에서 누른 항목)
  const selected = selectedFieldId ? (builder.fields.find((f) => f.id === selectedFieldId || f.name === selectedFieldId)?.id ?? null) : null

  return (
    <IconsContext.Provider value={mergedIcons}>
      <Box>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={form.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {form.sections.map((section, index) => (
              <SortableSectionEditor
                key={section.id}
                section={section}
                isFirst={index === 0}
                isLast={index === form.sections.length - 1}
                canRemove={form.sections.length > 1 && (section.fields.length === 0 || fieldSections.filter(Boolean).length > 1)}
                kinds={kinds}
                sectionTypes={sectionTypes}
                locked={builder.locked}
                showKeys={showKeys}
                openFieldId={openFieldId}
                selectedFieldId={selected}
                onFieldSelect={onFieldSelect}
                onUpdate={builder.updateSection}
                onRemove={builder.removeSection}
                onMove={builder.moveSection}
                onAddField={(sectionId) => setOpenFieldId(builder.addField(sectionId).id)}
                onUpdateField={builder.updateField}
                onKind={builder.setKind}
                onRemoveField={builder.removeField}
                onMoveField={builder.moveField}
                onReorderField={builder.reorderField}
                renderFieldExtra={renderFieldExtra}
                hasPrevFields={fieldSections.slice(0, index).some(Boolean)}
                hasNextFields={fieldSections.slice(index + 1).some(Boolean)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Stack direction="row" spacing={1} sx={{ mb: showRules ? 3 : 0 }}>
          <Button size="small" variant="outlined" startIcon={mergedIcons.add} onClick={() => builder.addSection()}>
            섹션 추가
          </Button>
        </Stack>

        {showRules && <RulesEditor rules={form.rules ?? []} fields={builder.fields} onChange={builder.setRules} />}
      </Box>
    </IconsContext.Provider>
  )
}

export { FormBuilder }

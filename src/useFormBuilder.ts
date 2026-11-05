import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { compileDefinition, defaultKey, emptyDefinition, fieldsOf, hasOptions, kindsOf, tidyRules, uid } from "./compile"
import type { FieldDefinition, FieldKind, FormDefinition, FormRule, SectionDefinition, UseFormBuilderOptions, UseFormBuilderReturn } from "./types"

function move<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || to < 0 || to >= list.length || from === to) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const firstOption = () => [{ value: "선택 1", label: "선택 1" }]

/** 종류를 바꿀 때 남길 것만 남긴다. 제목 · 설명 · 필수 · extra 는 그대로 */
function withKind(field: FieldDefinition, kind: FieldKind): FieldDefinition {
  const { title, description, options } = field.schema
  return {
    ...field,
    kind,
    schema: { title, description, ...(hasOptions(kind) ? { options: options?.length ? options : firstOption() } : {}) },
    ui: { placeholder: field.ui.placeholder },
  }
}

const mapFields = (form: FormDefinition, change: (f: FieldDefinition) => FieldDefinition): FormDefinition => ({
  ...form,
  sections: form.sections.map((s) => ({ ...s, fields: s.fields.map(change) })),
})

/**
 * 정의를 들고 고치는 훅. 그리는 것은 `FormBuilder` 가 하고, 직접 그려도 된다.
 *
 * - 항목 키는 `keyOf(nextKey)` 로 매기고 nextKey 를 올린다. 지운 번호는 다시 쓰지 않는다
 * - `locked` 의 키는 종류를 바꾸지 못한다. 기본은 처음 정의에 든 항목이다
 * - 정의가 바뀌면 `onChange(definition, schemas)` 를 부른다
 */
export const useFormBuilder = (initialForm?: FormDefinition, options: UseFormBuilderOptions = {}): UseFormBuilderReturn => {
  const [form, setForm] = useState<FormDefinition>(() => initialForm ?? emptyDefinition())
  const [initialLocked] = useState(() => (initialForm ? kindsOf(initialForm) : new Map<string, FieldKind>()))
  const locked = options.locked ?? initialLocked
  const keyOf = options.keyOf ?? defaultKey

  const latest = useRef(options)
  useEffect(() => {
    latest.current = options
  })
  const first = useRef(form)
  const schemas = useMemo(() => compileDefinition(form), [form])
  useEffect(() => {
    if (form !== first.current) latest.current.onChange?.(form, schemas)
  }, [form, schemas])

  // ============ 섹션 ============

  const addSection = useCallback((partial?: Partial<SectionDefinition>) => {
    const id = partial?.id ?? uid()
    const section: SectionDefinition = { id, title: "새 섹션", type: "fields", fields: [], ui: { grid: 1 }, ...partial, name: partial?.name || `section_${id}` }
    setForm((prev) => ({ ...prev, sections: [...prev.sections, section] }))
    return section
  }, [])

  const updateSection = useCallback((sectionId: string, updates: Partial<SectionDefinition>) => {
    setForm((prev) => {
      const next = { ...prev, sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)) }
      // 항목 섹션이 아닌 것으로 바꾸면 항목은 앞 섹션으로 보낸다
      const index = next.sections.findIndex((s) => s.id === sectionId)
      const section = next.sections[index]
      if (!section || section.type === "fields" || section.fields.length === 0) return next
      const target = next.sections.findIndex((s, i) => i !== index && s.type === "fields")
      if (target < 0) return prev
      return {
        ...next,
        sections: next.sections.map((s, i) => (i === target ? { ...s, fields: [...s.fields, ...section.fields] } : i === index ? { ...s, fields: [] } : s)),
      }
    })
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setForm((prev) => {
      if (prev.sections.length <= 1) return prev
      const index = prev.sections.findIndex((s) => s.id === sectionId)
      if (index < 0) return prev
      const moving = prev.sections[index].fields
      if (moving.length > 0) {
        const before = prev.sections.slice(0, index).map((s, i) => [s, i] as const).filter(([s]) => s.type === "fields").pop()
        const after = prev.sections.map((s, i) => [s, i] as const).find(([s, i]) => i > index && s.type === "fields")
        const target = (before ?? after)?.[1]
        if (target === undefined) return prev
        const sections = prev.sections.map((s, i) => (i === target ? { ...s, fields: i < index ? [...s.fields, ...moving] : [...moving, ...s.fields] } : s))
        return { ...prev, sections: sections.filter((s) => s.id !== sectionId) }
      }
      return { ...prev, sections: prev.sections.filter((s) => s.id !== sectionId) }
    })
  }, [])

  const moveSection = useCallback((sectionId: string, direction: "up" | "down") => {
    setForm((prev) => {
      const index = prev.sections.findIndex((s) => s.id === sectionId)
      return { ...prev, sections: move(prev.sections, index, index + (direction === "up" ? -1 : 1)) }
    })
  }, [])

  const reorderSection = useCallback((activeId: string, overId: string) => {
    setForm((prev) => ({
      ...prev,
      sections: move(prev.sections, prev.sections.findIndex((s) => s.id === activeId), prev.sections.findIndex((s) => s.id === overId)),
    }))
  }, [])

  // ============ 항목 ============

  // 같은 틱에 여럿을 더해도 번호가 겹치지 않게 다음 번호를 따로 센다
  const nextKey = useRef(form.nextKey)
  useEffect(() => {
    nextKey.current = Math.max(nextKey.current, form.nextKey)
  }, [form.nextKey])

  const addField = useCallback(
    (sectionId: string, partial?: Partial<FieldDefinition>) => {
      const kind = partial?.kind ?? "text"
      let name = partial?.name
      if (!name) {
        name = keyOf(nextKey.current)
        nextKey.current += 1
      }
      const made: FieldDefinition = {
        id: uid(),
        kind,
        required: false,
        schema: { title: "새 항목", ...(hasOptions(kind) ? { options: firstOption() } : {}) },
        ui: {},
        ...partial,
        name,
      }
      const after = nextKey.current
      setForm((prev) => ({
        ...prev,
        nextKey: Math.max(prev.nextKey, after),
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, fields: [...s.fields, made] } : s)),
      }))
      return made
    },
    [keyOf],
  )

  const updateField = useCallback(
    (_sectionId: string, fieldId: string, updates: Partial<FieldDefinition>) => {
      setForm((prev) =>
        mapFields(prev, (f) => {
          if (f.id !== fieldId) return f
          const next = { ...f, ...updates }
          // 잠긴 키는 이름과 종류를 그대로 둔다
          if (locked.has(f.name)) return { ...next, name: f.name, kind: f.kind }
          return next
        }),
      )
    },
    [locked],
  )

  const setKind = useCallback(
    (fieldId: string, kind: FieldKind) => {
      setForm((prev) => mapFields(prev, (f) => (f.id !== fieldId || locked.has(f.name) || f.kind === kind ? f : withKind(f, kind))))
    },
    [locked],
  )

  const removeField = useCallback((_sectionId: string, fieldId: string) => {
    setForm((prev) => {
      const next = { ...prev, sections: prev.sections.map((s) => ({ ...s, fields: s.fields.filter((f) => f.id !== fieldId) })) }
      return { ...next, rules: tidyRules(next) }
    })
  }, [])

  const moveField = useCallback((_sectionId: string, fieldId: string, direction: "up" | "down") => {
    setForm((prev) => {
      const step = direction === "up" ? -1 : 1
      const at = prev.sections.findIndex((s) => s.fields.some((f) => f.id === fieldId))
      if (at < 0) return prev
      const fields = prev.sections[at].fields
      const index = fields.findIndex((f) => f.id === fieldId)
      if (index + step >= 0 && index + step < fields.length) {
        return { ...prev, sections: prev.sections.map((s, i) => (i === at ? { ...s, fields: move(fields, index, index + step) } : s)) }
      }
      let neighbour = at + step
      while (neighbour >= 0 && neighbour < prev.sections.length && prev.sections[neighbour].type !== "fields") neighbour += step
      if (neighbour < 0 || neighbour >= prev.sections.length) return prev
      const field = fields[index]
      return {
        ...prev,
        sections: prev.sections.map((s, i) => {
          if (i === at) return { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          if (i === neighbour) return { ...s, fields: step > 0 ? [field, ...s.fields] : [...s.fields, field] }
          return s
        }),
      }
    })
  }, [])

  const reorderField = useCallback((sectionId: string, activeId: string, overId: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === sectionId ? { ...s, fields: move(s.fields, s.fields.findIndex((f) => f.id === activeId), s.fields.findIndex((f) => f.id === overId)) } : s,
      ),
    }))
  }, [])

  const setRules = useCallback((rules: FormRule[]) => setForm((prev) => ({ ...prev, rules })), [])

  // ============ 그 밖 ============

  const toSchemas = useCallback(() => compileDefinition(form), [form])
  const getSection = useCallback((sectionId: string) => form.sections.find((s) => s.id === sectionId), [form.sections])
  const getField = useCallback((sectionId: string, fieldId: string) => form.sections.find((s) => s.id === sectionId)?.fields.find((f) => f.id === fieldId), [form.sections])
  const reset = useCallback(() => setForm(emptyDefinition()), [])
  const loadForm = useCallback((next: FormDefinition) => setForm(next), [])
  const fields = useMemo(() => fieldsOf(form), [form])

  return {
    form,
    schemas,
    fields,
    locked,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    reorderSection,
    addField,
    updateField,
    setKind,
    removeField,
    moveField,
    reorderField,
    setRules,
    toSchemas,
    getSection,
    getField,
    reset,
    loadForm,
  }
}

export default useFormBuilder

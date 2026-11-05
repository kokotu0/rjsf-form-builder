import type { FieldKind, SectionType } from "./types"

/** 편집기에 보이는 종류 이름 */
export const KIND_LABELS: Record<FieldKind, string> = {
  text: "한 줄 글",
  textarea: "여러 줄 글",
  phone: "전화번호",
  email: "이메일",
  number: "숫자",
  integer: "숫자(정수)",
  date: "날짜",
  select: "선택",
  multiselect: "여러 개 선택",
  checkbox: "체크",
}

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  fields: "항목",
  image: "이미지",
  description: "설명",
}

export const SELECT_DISPLAY_LABELS: Record<"select" | "radio", string> = {
  select: "드롭다운",
  radio: "라디오 버튼",
}

/** 섹션 한 줄에 놓는 항목 수 */
export const GRID_CHOICES = [1, 2, 3] as const

/** 글 종류: 안내 문구를 쓸 수 있다 */
export const TYPED_KINDS: FieldKind[] = ["text", "textarea", "phone", "email", "number", "integer"]

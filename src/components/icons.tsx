import { createContext, useContext } from "react"
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  KeyboardArrowUp as UpIcon,
  KeyboardArrowDown as DownIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from "@mui/icons-material"

import type { FormBuilderIcons } from "../types"

export const DEFAULT_ICONS: Required<FormBuilderIcons> = {
  add: <AddIcon fontSize="small" />,
  remove: <DeleteIcon fontSize="small" />,
  up: <UpIcon fontSize="small" />,
  down: <DownIcon fontSize="small" />,
  drag: <DragIcon fontSize="small" />,
  expand: <ExpandIcon fontSize="small" />,
  collapse: <CollapseIcon fontSize="small" />,
}

/** 쓰는 쪽이 아이콘을 바꿀 수 있게 */
export const IconsContext = createContext<Required<FormBuilderIcons>>(DEFAULT_ICONS)
export const useIcons = () => useContext(IconsContext)

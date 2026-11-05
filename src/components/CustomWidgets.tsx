import { TextField, Box, IconButton, InputAdornment } from "@mui/material"
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material"
import type { WidgetProps } from "@rjsf/utils"

/** 전화번호에 쓰는 글자: 숫자, +, -, 괄호, 점, 빈칸 */
const PHONE_CHARS = /[^0-9+()\-. ]/g

/**
 * 전화번호 위젯. 입력한 그대로 둔다(0.1 은 010-0000-0000 꼴로 바꿔 국제 번호와 내선이 깨졌다).
 * 다른 글자만 빼고, 휴대폰에서는 숫자 자판을 띄운다.
 */
export const PhoneNumberWidget = (props: WidgetProps) => {
  const { id, value, disabled, readonly, onChange, onBlur, onFocus, label, required, placeholder, rawErrors, hideLabel } = props
  return (
    <TextField
      id={id}
      label={hideLabel ? undefined : label}
      value={value ?? ""}
      onChange={(e) => {
        const typed = e.target.value.replace(PHONE_CHARS, "")
        onChange(typed === "" ? undefined : typed)
      }}
      onBlur={(e) => onBlur(id, e.target.value)}
      onFocus={(e) => onFocus(id, e.target.value)}
      disabled={disabled || readonly}
      required={required}
      error={!!rawErrors?.length}
      placeholder={placeholder}
      fullWidth
      size="small"
      type="tel"
      slotProps={{ htmlInput: { inputMode: "tel", maxLength: 40, autoComplete: "tel" } }}
    />
  )
}

/**
 * 증감 버튼 위젯 (UpDown)
 */
export const UpDownWidget = (props: WidgetProps) => {
  const { id, value, disabled, readonly, onChange, label, required, schema } = props

  const numValue = typeof value === "number" ? value : 0
  const step = (schema.multipleOf as number) || 1
  const min = schema.minimum as number | undefined
  const max = schema.maximum as number | undefined

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "") onChange(undefined)
    else if (!isNaN(Number(val))) onChange(Number(val))
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <TextField
        id={id}
        label={label}
        type="number"
        value={value ?? ""}
        onChange={handleInputChange}
        disabled={disabled || readonly}
        required={required}
        size="small"
        sx={{ flex: 1 }}
        slotProps={{
          htmlInput: { min, max, step },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="빼기" onClick={() => (min === undefined || numValue - step >= min) && onChange(numValue - step)} disabled={disabled || readonly || (min !== undefined && numValue <= min)}>
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="더하기" onClick={() => (max === undefined || numValue + step <= max) && onChange(numValue + step)} disabled={disabled || readonly || (max !== undefined && numValue >= max)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    </Box>
  )
}

export const customWidgets = {
  phone: PhoneNumberWidget,
  updown: UpDownWidget,
}

export default customWidgets

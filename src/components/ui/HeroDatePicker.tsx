import { Calendar, DateField, DatePicker } from '@heroui/react'
import { parseDate, parseDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { cn } from '../../lib/utils'

interface HeroDatePickerProps {
  value: string
  onChange: (isoDate: string) => void
  className?: string
}

function DatePickerInner({ value, onChange, className, withTime }: HeroDatePickerProps & { withTime?: boolean }) {
  const dateValue: DateValue | null = value
    ? (() => {
        try { return withTime ? parseDateTime(value) : parseDate(value) }
        catch { return null }
      })()
    : null

  return (
    <DatePicker
      key={value || '__empty__'}
      value={dateValue}
      onChange={(val) => onChange(val ? val.toString() : '')}
      className={cn('w-full', className)}
    >
      <DateField.Group className="input flex items-center gap-1 h-9 px-3 cursor-pointer">
        <DateField.Input className="flex-1 flex items-center gap-0.5 text-sm text-foreground outline-none">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>

      <DatePicker.Popover>
        <Calendar aria-label="Choose date">
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  )
}

/** Date-only picker — value/onChange use YYYY-MM-DD strings */
export function HeroDatePickerField({ value, onChange, className }: HeroDatePickerProps) {
  return <DatePickerInner value={value} onChange={onChange} className={className} />
}

/** Date + time picker — value/onChange use YYYY-MM-DDTHH:mm strings */
export function HeroDateTimePickerField({ value, onChange, className }: HeroDatePickerProps) {
  return <DatePickerInner value={value} onChange={onChange} className={className} withTime />
}

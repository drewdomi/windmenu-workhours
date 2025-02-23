import { DAYS_OF_WEEK } from 'src/app/constants/week'

export function getDaysBetweenSelections(formValue: any): string[] {
  // Get all selected days
  const selectedDays = Object.entries(formValue)
    .filter(([_, value]: [string, any]) => value.isOpen)
    .map(([day]) => day)

  if (selectedDays.length < 2) {
    return []
  }

  // Find the first and last selected days in the week
  const firstSelectedIndex = Math.min(
    ...selectedDays.map(day => DAYS_OF_WEEK.indexOf(day))
  )
  const lastSelectedIndex = Math.max(
    ...selectedDays.map(day => DAYS_OF_WEEK.indexOf(day))
  )

  // Get all days between first and last selection
  return DAYS_OF_WEEK.slice(firstSelectedIndex, lastSelectedIndex + 1)
}

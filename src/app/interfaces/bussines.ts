export interface BusinessHours {
  [key: string]: DaySchedule
}

export interface DaySchedule {
  isOpen: boolean
  hours: Hours | null
  break?: {
    start: string
    end: string
  }
}

export interface Hours {
  open: string | null
  close: string | null
}

export interface WorkHoursSelection {
  days: string[]
  isRange: boolean
}

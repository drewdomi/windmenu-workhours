export interface BusinessHours {
  [key: string]: DaySchedule
}

export interface DaySchedule {
  isOpen: boolean
  hours: Hours | null
  break?: {
    start: string
    end: string
    type?: string
  }
  breaks?: null
}

export interface Hours {
  open: string
  close: string
}

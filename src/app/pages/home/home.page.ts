import { CommonModule } from '@angular/common'
import { Component, inject, OnInit } from '@angular/core'
import {
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule
} from '@angular/forms'
import {
  IonButton,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemGroup,
  IonLabel,
  IonList,
  IonRow,
  IonTitle,
  IonToggle,
  IonToolbar
} from '@ionic/angular/standalone'
import { debounceTime } from 'rxjs'

const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
]

interface WorkHoursSelection {
  days: string[]
  isRange: boolean
}

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonItemGroup,
    IonGrid,
    IonToggle,
    IonTitle,
    IonCol,
    IonButton,
    IonFooter,
    IonContent,
    IonList,
    IonItemDivider,
    IonRow,
    IonLabel,
    IonItem,
    IonInput
  ]
})
export class HomePage implements OnInit {
  private readonly formBuilder = inject(NonNullableFormBuilder)
  businessHoursForm = this.formBuilder.group({})
  daysOfWeek = DAYS_OF_WEEK
  workHoursSelections: WorkHoursSelection[] = []
  private lastSelectedDays: string[] = []

  ngOnInit() {
    this.initForm()
    this.watchForm()
  }

  private initForm() {
    const group: { [key: string]: FormGroup } = {}
    this.daysOfWeek.forEach(day => {
      group[day] = this.formBuilder.group({
        isOpen: [false],
        hours: this.formBuilder.group({
          open: [''],
          close: ['']
        }),
        hasBreak: [false],
        break: this.formBuilder.group({
          start: [''],
          end: [''],
          type: ['']
        })
      })
    })
    this.businessHoursForm = this.formBuilder.group(group)
  }

  private watchForm() {
    this.businessHoursForm.valueChanges
      .pipe(debounceTime(800))
      .subscribe(value => {
        const selectedDays = Object.entries(value)
          .filter(([_, dayValue]: [string, any]) => dayValue.isOpen)
          .map(([day]) => day)

        // If no days are selected, reset everything
        if (selectedDays.length === 0) {
          this.workHoursSelections = []
          this.lastSelectedDays = []
          return
        }

        // Find newly selected days
        const newlySelectedDays = selectedDays.filter(
          day => !this.lastSelectedDays.includes(day)
        )

        // Find newly deselected days
        const deselectedDays = this.lastSelectedDays.filter(
          day => !selectedDays.includes(day)
        )

        // Handle deselections first
        if (deselectedDays.length > 0) {
          // Remove deselected days from all selections
          this.workHoursSelections = this.workHoursSelections
            .map(selection => ({
              ...selection,
              days: selection.days.filter(day => !deselectedDays.includes(day))
            }))
            .filter(selection => selection.days.length > 0)
        }

        // Handle new selections
        if (newlySelectedDays.length > 0) {
          // Check if we're making consecutive selections (potential range)
          const isConsecutiveSelection =
            newlySelectedDays.length > 1 &&
            newlySelectedDays.every((day, index) => {
              if (index === 0) return true
              const currentIndex = DAYS_OF_WEEK.indexOf(day)
              const prevIndex = DAYS_OF_WEEK.indexOf(
                newlySelectedDays[index - 1]
              )
              return currentIndex === prevIndex + 1
            })

          if (isConsecutiveSelection) {
            // Range selection
            this.workHoursSelections.push({
              days: newlySelectedDays,
              isRange: true
            })
            this.applyHoursToRange(newlySelectedDays)
          } else {
            // Individual selections
            newlySelectedDays.forEach(day => {
              // Check if the day isn't already part of any selection
              const isPartOfExistingSelection = this.workHoursSelections.some(
                selection => selection.days.includes(day)
              )

              if (!isPartOfExistingSelection) {
                this.workHoursSelections.push({
                  days: [day],
                  isRange: false
                })
              }
            })
          }
        }

        // Update last selected days
        this.lastSelectedDays = selectedDays

        // Sort selections by first day
        this.workHoursSelections.sort(
          (a, b) =>
            DAYS_OF_WEEK.indexOf(a.days[0]) - DAYS_OF_WEEK.indexOf(b.days[0])
        )
      })
  }

  private applyHoursToRange(days: string[]) {
    const firstDay = days[0]
    const firstDayHours = this.businessHoursForm
      .get(firstDay)
      ?.get('hours')?.value
    const firstDayBreak = this.businessHoursForm
      .get(firstDay)
      ?.get('break')?.value

    days.forEach(day => {
      const dayControl = this.businessHoursForm.get(day)
      if (dayControl) {
        dayControl.patchValue(
          {
            isOpen: true,
            hours: firstDayHours,
            break: firstDayBreak
          },
          { emitEvent: false }
        )
      }
    })
  }

  getRangeText(selection: WorkHoursSelection): string {
    if (!selection.isRange) {
      return (
        selection.days[0].charAt(0).toUpperCase() + selection.days[0].slice(1)
      )
    }
    const first = selection.days[0]
    const last = selection.days[selection.days.length - 1]
    return `${first.charAt(0).toUpperCase() + first.slice(1)} to ${last.charAt(0).toUpperCase() + last.slice(1)}`
  }

  onSubmit() {
    console.log('Business Hours:', this.businessHoursForm.getRawValue())
  }

  hasBreak(day: string): boolean {
    return this.businessHoursForm.get(day)?.get('hasBreak')?.value ?? false
  }

  toggleBreak(selection: WorkHoursSelection, checked: boolean) {
    const days = selection.days
    days.forEach(day => {
      const dayControl = this.businessHoursForm.get(day)
      if (dayControl) {
        dayControl.patchValue(
          {
            hasBreak: checked,
            break: checked
              ? dayControl.get('break')?.value
              : { start: '', end: '', type: '' }
          },
          { emitEvent: false }
        )
      }
    })
  }
}

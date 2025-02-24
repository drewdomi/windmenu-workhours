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
import { DAYS_OF_WEEK } from 'src/app/constants/week'
import { WorkHoursSelection } from 'src/app/interfaces/bussines'

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
          start: [null as string | null],
          end: [null as string | null]
        })
      })
    })
    this.businessHoursForm = this.formBuilder.group(group)
  }

  private findRanges(days: string[]): WorkHoursSelection[] {
    // Sort days according to DAYS_OF_WEEK order
    const sortedDays = [...days].sort(
      (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
    )

    const ranges: WorkHoursSelection[] = []
    let currentRange: string[] = []

    sortedDays.forEach((day, index) => {
      if (currentRange.length === 0) {
        currentRange.push(day)
      } else {
        // Check if this day creates a gap in the range
        const prevDayIndex = DAYS_OF_WEEK.indexOf(
          currentRange[currentRange.length - 1]
        )
        const currentDayIndex = DAYS_OF_WEEK.indexOf(day)

        // If there's a gap between days, start a new range
        if (currentDayIndex - prevDayIndex > 1) {
          ranges.push({
            days: [...currentRange],
            isRange: currentRange.length > 1
          })
          currentRange = [day]
        } else {
          currentRange.push(day)
        }
      }
    })

    // Add the last range
    if (currentRange.length > 0) {
      ranges.push({
        days: currentRange,
        isRange: currentRange.length > 1
      })
    }

    return ranges
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
          // Find groups of consecutive days in newly selected days
          const groups: string[][] = []
          let currentGroup: string[] = []

          // Sort newly selected days by their order in the week
          const sortedDays = [...newlySelectedDays].sort(
            (a, b) => DAYS_OF_WEEK.indexOf(a) - DAYS_OF_WEEK.indexOf(b)
          )

          sortedDays.forEach(day => {
            if (currentGroup.length === 0) {
              currentGroup.push(day)
            } else {
              const lastDayIndex = DAYS_OF_WEEK.indexOf(
                currentGroup[currentGroup.length - 1]
              )
              const currentDayIndex = DAYS_OF_WEEK.indexOf(day)

              if (currentDayIndex === lastDayIndex + 1) {
                // Consecutive day, add to current group
                currentGroup.push(day)
              } else {
                // Not consecutive, start a new group
                if (currentGroup.length > 0) {
                  groups.push([...currentGroup])
                }
                currentGroup = [day]
              }
            }
          })

          // Add the last group
          if (currentGroup.length > 0) {
            groups.push(currentGroup)
          }

          // Create selections for each group
          groups.forEach(group => {
            // Check if any day in the group is already part of an existing selection
            const isPartOfExisting = group.some(day =>
              this.workHoursSelections.some(selection =>
                selection.days.includes(day)
              )
            )

            if (!isPartOfExisting) {
              this.workHoursSelections.push({
                days: group,
                isRange: group.length > 1
              })

              // Apply hours to new range
              this.applyHoursToRange(group)
            }
          })
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
    const hasBreakValue = this.businessHoursForm
      .get(firstDay)
      ?.get('hasBreak')?.value

    days.forEach(day => {
      const dayControl = this.businessHoursForm.get(day)
      if (dayControl) {
        dayControl.patchValue(
          {
            isOpen: true,
            hours: firstDayHours,
            break: firstDayBreak,
            hasBreak: hasBreakValue
          },
          { emitEvent: false }
        )
      }
    })
  }

  getRangeText(selection: WorkHoursSelection): string {
    // If it's not a range or has only one day, just show the day name
    if (!selection.isRange || selection.days.length === 1) {
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

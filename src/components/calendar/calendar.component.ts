import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { toDateString } from '../../utils/date-helpers';
import { MoodLog } from '../../models/moody.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  moodLog?: MoodLog;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <header class="flex justify-between items-center mb-4">
        <button (click)="changeMonth(-1)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <i class="fas fa-chevron-left"></i>
        </button>
        <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {{ currentMonthDate() | date:'MMMM yyyy' }}
        </h2>
        <button (click)="changeMonth(1)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <i class="fas fa-chevron-right"></i>
        </button>
      </header>
      
      <div class="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 dark:text-gray-400 mb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (day of calendarDays(); track day.date) {
          <div 
            class="h-20 md:h-24 p-2 border rounded-md flex flex-col justify-start items-center"
            [class.bg-gray-50]="!day.isCurrentMonth"
            [class.dark:bg-gray-900]="!day.isCurrentMonth"
            [class.text-gray-400]="!day.isCurrentMonth"
            [class.dark:text-gray-600]="!day.isCurrentMonth"
            [class.border-indigo-500]="day.isToday"
            [class.dark:border-indigo-400]="day.isToday">
            <span class="font-medium" [class.text-indigo-600]="day.isToday" [class.dark:text-indigo-400]="day.isToday">
              {{ day.date | date:'d' }}
            </span>
            @if (day.moodLog) {
              <span class="mt-2 text-3xl" [title]="day.moodLog.note || 'Mood: ' + day.moodLog.rating + '/5'">
                {{ getMoodIcon(day.moodLog.rating) }}
              </span>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  dataService = inject(DataService);

  currentMonthDate = signal(new Date());

  moodsByDate = computed(() => {
    const map = new Map<string, MoodLog>();
    for (const log of this.dataService.moodLogs()) {
      map.set(log.date, log);
    }
    return map;
  });

  calendarDays = computed(() => {
    const days: CalendarDay[] = [];
    const date = this.currentMonthDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = toDateString(new Date());

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay();
    const endDay = lastDayOfMonth.getDate();

    // Days from previous month
    for (let i = startDay; i > 0; i--) {
      const prevMonthDate = new Date(year, month, 1 - i);
      days.push({
        date: prevMonthDate,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Days of current month
    for (let i = 1; i <= endDay; i++) {
      const currentDate = new Date(year, month, i);
      const dateStr = toDateString(currentDate);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: dateStr === today,
        moodLog: this.moodsByDate().get(dateStr),
      });
    }

    // Days from next month
    const totalDaysInGrid = Math.ceil((startDay + endDay) / 7) * 7;
    const remainingSlots = totalDaysInGrid - days.length > 0 ? totalDaysInGrid - days.length : (42 - days.length); // Ensure 6 weeks for consistency
    for (let i = 1; i <= remainingSlots; i++) {
        const nextMonthDate = new Date(year, month + 1, i);
        days.push({
            date: nextMonthDate,
            isCurrentMonth: false,
            isToday: false
        });
    }

    return days;
  });

  changeMonth(delta: number): void {
    this.currentMonthDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() + delta);
      return newDate;
    });
  }

  getMoodIcon(rating: number): string {
    switch (rating) {
      case 1: return '😠';
      case 2: return '🙁';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😁';
      default: return '';
    }
  }
}

import { Component, ChangeDetectionStrategy, inject, signal, computed, ElementRef, ViewChild, afterNextRender, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DataService } from '../../services/data.service';
import { toDateString } from '../../utils/date-helpers';
import { HabitLog, MoodLog, FoodLog, Habit } from '../../models/moody.model';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  activityCount: number; // For heatmap
}

interface DailyLog {
  date: string;
  mood?: MoodLog;
  habits: { title: string; value: number; target: number; unit: string; }[];
  food: FoodLog[];
}

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trends.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendsComponent implements OnDestroy {
  private dataService = inject(DataService);
  private platformId = inject(PLATFORM_ID);
  private subscriptions = new Subscription();

  @ViewChild('moodChart') private moodChartContainer!: ElementRef;
  @ViewChild('weightChart') private weightChartContainer!: ElementRef;
  
  // Calendar State
  currentMonthDate = signal(new Date());
  selectedDayLog = signal<DailyLog | null>(null);

  // Stats
  longestStreak = computed(() => {
    // This is a simplified calculation. A more robust one would handle gaps.
    const habitLogs = this.dataService.habitLogs();
    const habits = this.dataService.habits();
    if (habitLogs.length === 0 || habits.length === 0) return 0;

    // FIX: Explicitly type the Set to avoid a type inference issue where `completedDates` could become `Set<unknown>`.
    const completedDates = new Set<string>(
      habitLogs
        .filter(log => {
          const habit = habits.find(h => h.id === log.habitId);
          return habit && log.value >= habit.target;
        })
        .map(log => log.date)
    );

    let maxStreak = 0;
    let currentStreak = 0;
    const sortedDates: string[] = [...completedDates].sort();
    
    if (sortedDates.length === 0) return 0;

    let lastDate = new Date(sortedDates[0]);
    lastDate.setDate(lastDate.getDate() - 1); // Start before the first date

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr);
      const diff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1; // Reset streak
      }
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
      lastDate = currentDate;
    }
    return maxStreak;
  });

  completionRate = computed(() => {
    const habitLogs = this.dataService.habitLogs();
    const habits = this.dataService.habits();
    if (habits.length === 0) return 0;

    const totalTrackedDays = new Set<string>(habitLogs.map(log => log.date)).size;
    if (totalTrackedDays === 0) return 0;

    let completedCount = 0;
    const logsByDate = new Map<string, HabitLog[]>();
    habitLogs.forEach(log => {
        const logs = logsByDate.get(log.date) || [];
        logs.push(log);
        logsByDate.set(log.date, logs);
    });

    logsByDate.forEach((logs) => {
        const allHabitsDone = habits.every(habit => {
            const log = logs.find(l => l.habitId === habit.id);
            return log && log.value >= habit.target;
        });
        if (allHabitsDone) completedCount++;
    });

    return Math.round((completedCount / totalTrackedDays) * 100);
  });
  
  habitsDone = computed(() => this.dataService.habitLogs().length);

  avgMood = computed(() => {
    const moods = this.dataService.moodLogs();
    if (moods.length === 0) return 0;
    const total = moods.reduce((acc, log) => acc + log.rating, 0);
    return parseFloat((total / moods.length).toFixed(1));
  });

  // Calendar generation
  logsByDate = computed(() => {
    const map = new Map<string, { mood?: MoodLog; habits: HabitLog[]; food: FoodLog[] }>();
    this.dataService.moodLogs().forEach(log => {
      if (!map.has(log.date)) map.set(log.date, { habits: [], food: [] });
      map.get(log.date)!.mood = log;
    });
    this.dataService.habitLogs().forEach(log => {
      if (!map.has(log.date)) map.set(log.date, { habits: [], food: [] });
      map.get(log.date)!.habits.push(log);
    });
    this.dataService.foodLogs().forEach(log => {
      if (!map.has(log.date)) map.set(log.date, { habits: [], food: [] });
      map.get(log.date)!.food.push(log);
    });
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
      days.push({ date: new Date(year, month, 1 - i), isCurrentMonth: false, isToday: false, activityCount: 0 });
    }

    // Days of current month
    for (let i = 1; i <= endDay; i++) {
      const currentDate = new Date(year, month, i);
      const dateStr = toDateString(currentDate);
      const log = this.logsByDate().get(dateStr);
      const completedHabits = log?.habits.filter(hLog => {
        const habit = this.dataService.habits().find(h => h.id === hLog.habitId);
        return habit && hLog.value >= habit.target;
      }).length || 0;

      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isToday: dateStr === today,
        activityCount: completedHabits + (log?.mood ? 1 : 0),
      });
    }
    
    // Fill remaining grid
     const totalDaysInGrid = 42;
     const remainingSlots = totalDaysInGrid - days.length;
     for (let i = 1; i <= remainingSlots; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, isToday: false, activityCount: 0 });
     }

    return days;
  });
  
  // Chart Data
  moodData = computed(() => {
    return this.dataService.moodLogs()
      .map(log => ({ date: new Date(log.date), value: log.rating }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  weightData = computed(() => {
    return this.dataService.weightLogs()
      .map(log => ({ date: new Date(log.date), value: log.weightKg }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  constructor() {
    afterNextRender(() => {
      this.subscriptions.add(toObservable(this.moodData).subscribe(data => {
        if (data.length > 1) this.createChart(this.moodChartContainer.nativeElement, data, [1, 5], 'Mood Rating');
      }));
      this.subscriptions.add(toObservable(this.weightData).subscribe(data => {
        if (data.length > 1) this.createChart(this.weightChartContainer.nativeElement, data, undefined, 'Weight (kg)');
      }));
    });
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  changeMonth(delta: number): void {
    this.currentMonthDate.update(d => {
      const newDate = new Date(d);
      newDate.setMonth(d.getMonth() + delta);
      return newDate;
    });
  }

  viewDayDetails(day: CalendarDay) {
    if (!day.isCurrentMonth || day.activityCount === 0) return;
    const dateStr = toDateString(day.date);
    const dailyData = this.logsByDate().get(dateStr);
    const habits = this.dataService.habits();
    
    const habitDetails = dailyData?.habits.map(hLog => {
        const habit = habits.find(h => h.id === hLog.habitId);
        return {
            title: habit?.title || 'Unknown Habit',
            value: hLog.value,
            target: habit?.target || 0,
            unit: habit?.unit || ''
        }
    }) || [];

    this.selectedDayLog.set({
      date: dateStr,
      mood: dailyData?.mood,
      habits: habitDetails,
      food: dailyData?.food || []
    });
  }

  closeModal() {
    this.selectedDayLog.set(null);
  }

  getMoodIcon(rating: number): string {
    return ['😠', '🙁', '😐', '🙂', '😁'][rating - 1] || '😶';
  }

  private createChart(container: HTMLElement, data: { date: Date, value: number }[], yDomain: [number, number] | undefined, yLabel: string): void {
    if (!container || !isPlatformBrowser(this.platformId) || data.length < 2) return;
    
    d3.select(container).select('svg').remove();
    
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 256 - margin.top - margin.bottom; // Fixed height for consistency

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
      
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yDomainWithPadding = yDomain ? yDomain : [(d3.min(data, d => d.value) ?? 0) * 0.95, (d3.max(data, d => d.value) ?? 0) * 1.05];
    const y = d3.scaleLinear()
      .domain(yDomainWithPadding)
      .range([height, 0]);

    // Axis styling for dark theme
    const axisColor = '#9CA3AF'; // gray-400

    const xAxis = g => g
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d")))
      .call(g => g.selectAll('line').style('stroke', axisColor))
      .call(g => g.selectAll('path').style('stroke', axisColor))
      .call(g => g.selectAll('text').style('fill', axisColor));

    const yAxis = g => g
      .call(d3.axisLeft(y).ticks(5))
      .call(g => g.selectAll('line').style('stroke', axisColor))
      .call(g => g.selectAll('path').style('stroke', axisColor))
      .call(g => g.selectAll('text').style('fill', axisColor));

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);


    const line = d3.line<{ date: Date, value: number }>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Main line
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#7C5CFF') // Primary accent
      .attr('stroke-width', 2.5)
      .attr('d', line);
      
    // Data points
    svg.selectAll("dot")
        .data(data)
        .enter().append("circle")
        .attr("r", 4)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.value))
        .style('fill', '#00E0B8'); // Secondary accent
  }
}
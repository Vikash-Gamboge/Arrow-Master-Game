import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Trophy,
  CheckCircle2,
  Calendar as CalendarIcon,
  Play,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  getMonthDaysCount,
  getMonthCompletedCount,
  isDailyDateCompleted,
  getCompletedDailyDates,
  preloadDailyMission,
} from '../game/dailyChallenge';
import { sound } from '../game/sound';

interface DailyChallengeScreenProps {
  onBack: () => void;
  onPlayMission: (dateStr: string) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DailyChallengeScreen: React.FC<DailyChallengeScreenProps> = ({
  onBack,
  onPlayMission,
}) => {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth());

  // Format today's string: YYYY-MM-DD
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Selected date defaults to today if in current month/year, else 1st of viewed month
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    return today.getDate();
  });

  const selectedDateStr = useMemo(() => {
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(selectedDay).padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  }, [currentYear, currentMonth, selectedDay]);

  const monthDaysCount = useMemo(
    () => getMonthDaysCount(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Day of week of the 1st of this month (0 = Sun, 6 = Sat)
  const firstDayWeekday = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const monthStats = useMemo(() => {
    return getMonthCompletedCount(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const completedDates = useMemo(() => {
    return new Set(getCompletedDailyDates());
  }, [currentYear, currentMonth, selectedDateStr]);

  const isSelectedCompleted = completedDates.has(selectedDateStr);

  const [isStarting, setIsStarting] = useState(false);

  // Proactively pre-cache the selected date and today's date in background (0ms UI impact)
  useEffect(() => {
    preloadDailyMission(selectedDateStr);
    preloadDailyMission(todayStr);
  }, [selectedDateStr, todayStr]);

  const handlePrevMonth = () => {
    sound.playTap();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    sound.playTap();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  };

  const handleSelectDay = (day: number) => {
    sound.playTap();
    setSelectedDay(day);
    const m = String(currentMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const cellDateStr = `${currentYear}-${m}-${d}`;
    preloadDailyMission(cellDateStr);
  };

  const handleStartMission = () => {
    if (isStarting) return;
    sound.playTap();
    setIsStarting(true);
    onPlayMission(selectedDateStr);
  };

  return (
    <div
      role="region"
      aria-label="Daily Challenge Calendar"
      className="h-full w-full flex flex-col justify-between p-3.5 sm:p-5 select-none overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800"
    >
      {/* 1. Header with Back button, Title & Month completion trophy */}
      <header className="shrink-0 flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            onBack();
          }}
          aria-label="Back to Home"
          className="p-2 rounded-full bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all text-slate-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
            Daily Challenge
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 block">
            Arrow Master Missions
          </span>
        </div>

        {/* Month Completion Ratio with Trophy Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-950 font-black text-xs shadow-2xs">
          <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
          <span className="tabular-nums">
            {monthStats.completed}/{monthStats.totalDays}
          </span>
        </div>
      </header>

      {/* 2. Month Selector (< October 2026 >) */}
      <div className="shrink-0 flex items-center justify-between px-2 py-2.5 my-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Previous Month"
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-black text-slate-800 tracking-tight">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Next Month"
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 active:scale-90 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3. Calendar Grid (Sun–Sat) */}
      <main className="flex-1 flex flex-col justify-start bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-sm relative overflow-hidden min-h-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-1 border-b border-slate-100">
          {WEEKDAYS.map((wd) => (
            <span
              key={wd}
              className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 flex-1 items-center auto-rows-fr">
          {/* Empty offset cells before 1st of month */}
          {Array.from({ length: firstDayWeekday }).map((_, idx) => (
            <div key={`offset-${idx}`} className="w-full h-full min-h-[36px]" />
          ))}

          {/* Actual day cells */}
          {Array.from({ length: monthDaysCount }).map((_, i) => {
            const dayNum = i + 1;
            const m = String(currentMonth + 1).padStart(2, '0');
            const d = String(dayNum).padStart(2, '0');
            const cellDateStr = `${currentYear}-${m}-${d}`;

            const isSelected = selectedDay === dayNum;
            const isCompleted = completedDates.has(cellDateStr);
            const isToday = cellDateStr === todayStr;

            return (
              <button
                key={`day-${dayNum}`}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={`relative w-full aspect-square max-h-[46px] rounded-2xl flex flex-col items-center justify-center font-black text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105 z-10 ring-2 ring-blue-400'
                    : isCompleted
                    ? 'bg-amber-50/80 text-amber-900 border border-amber-300/80 hover:bg-amber-100'
                    : isToday
                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-400 hover:bg-blue-100'
                    : 'bg-slate-50/70 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="leading-none">{dayNum}</span>

                {/* Completion badge */}
                {isCompleted && (
                  <span className="absolute bottom-1">
                    <Trophy className={`w-2.5 h-2.5 ${isSelected ? 'text-amber-200 fill-amber-300' : 'text-amber-500 fill-amber-400'}`} />
                  </span>
                )}

                {/* Today indicator dot if not completed */}
                {isToday && !isCompleted && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* 4. Bottom Mission Card with CONTINUE / PLAY Action */}
      <footer className="shrink-0 flex flex-col gap-2 pt-2.5">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>
              {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
            </span>
          </div>

          {isSelectedCompleted ? (
            <div className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready to Play</span>
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={isStarting}
          onClick={handleStartMission}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer touch-manipulation disabled:opacity-85"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isSelectedCompleted ? 'REPLAY MISSION' : 'CONTINUE'}</span>
        </button>
      </footer>
    </div>
  );
};

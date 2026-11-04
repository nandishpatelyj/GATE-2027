import { useState, useEffect } from 'react';

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  isExamDay: boolean;
  isPast: boolean;
}

function computeCountdown(examDateStr: string): CountdownState {
  const [y, m, d] = examDateStr.split('-').map(Number);
  // GATE morning session starts at 09:30 local time on the configured exam date
  const target = new Date(y || 2027, (m || 2) - 1, d || 6, 9, 30, 0, 0);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  const sameCalendarDay =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      isExamDay: sameCalendarDay,
      isPast: !sameCalendarDay,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const totalHours = Math.floor(totalSeconds / 3600);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    isExamDay: sameCalendarDay,
    isPast: false,
  };
}

export function useCountdown(examDateStr: string): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>(() =>
    computeCountdown(examDateStr)
  );

  useEffect(() => {
    setCountdown(computeCountdown(examDateStr));
    const timer = window.setInterval(() => {
      setCountdown(computeCountdown(examDateStr));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [examDateStr]);

  return countdown;
}

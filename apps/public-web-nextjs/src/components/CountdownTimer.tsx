"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: string; // ISO String format
  onFinished?: () => void;
}

export function CountdownTimer({ targetDate, onFinished }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    const checkFinished = (timeObj: typeof timeLeft) => {
      if (timeObj.days === 0 && timeObj.hours === 0 && timeObj.minutes === 0 && timeObj.seconds === 0) {
        if (onFinished) {
          onFinished();
        }
        return true;
      }
      return false;
    };

    // PERFORMANCE: Jadwalkan state awal di luar body effect agar sesuai kontrak React 19.
    const mountedTimer = window.setTimeout(() => {
      setMounted(true);
      const initialTime = calculateTimeLeft();
      setTimeLeft(initialTime);
      checkFinished(initialTime);
    }, 0);

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (checkFinished(newTimeLeft)) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      window.clearTimeout(mountedTimer);
      clearInterval(interval);
    };
  }, [targetDate, onFinished]);

  if (!mounted) {
    return (
      <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="aspect-square w-full max-w-20 rounded-2xl bg-slate-200 backdrop-blur-md animate-pulse dark:bg-slate-800"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-4">
      {[
        { label: 'Hari', value: timeLeft.days },
        { label: 'Jam', value: timeLeft.hours },
        { label: 'Menit', value: timeLeft.minutes },
        { label: 'Detik', value: timeLeft.seconds },
      ].map((item, idx) => (
        <div key={idx} className="flex min-w-0 flex-col items-center">
          <div className="flex aspect-square w-full max-w-20 items-center justify-center rounded-xl border border-white/20 bg-white/85 shadow-lg backdrop-blur-md sm:rounded-2xl dark:border-slate-700/50 dark:bg-slate-800/80">
            <span className="text-xl font-black text-primary-700 sm:text-2xl md:text-3xl dark:text-primary-300">
              {item.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="mt-2 text-[10px] font-bold uppercase tracking-wide text-white drop-shadow-sm sm:text-xs md:text-sm md:tracking-wider">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

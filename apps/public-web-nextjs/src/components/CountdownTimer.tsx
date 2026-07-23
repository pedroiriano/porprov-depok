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
      <div className="flex gap-4 justify-center mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse backdrop-blur-md"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 justify-center mt-6">
      {[
        { label: 'Hari', value: timeLeft.days },
        { label: 'Jam', value: timeLeft.hours },
        { label: 'Menit', value: timeLeft.minutes },
        { label: 'Detik', value: timeLeft.seconds },
      ].map((item, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/80 dark:bg-slate-800/80 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 dark:border-slate-700/50">
            <span className="text-2xl font-black text-primary-700 md:text-3xl dark:text-primary-300">
              {item.value.toString().padStart(2, '0')}
            </span>
          </div>
          <span className="text-xs md:text-sm font-bold text-white mt-2 uppercase tracking-wider drop-shadow-sm">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

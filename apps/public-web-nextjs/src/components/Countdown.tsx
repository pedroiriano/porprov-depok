"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return timeLeft;
    };

    const initialTimer = window.setTimeout(() => setTimeLeft(calculateTimeLeft()), 0);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => {
      window.clearTimeout(initialTimer);
      clearInterval(timer);
    };
  }, [targetDate]);

  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
      {[
        { label: "HARI", value: timeLeft.days },
        { label: "JAM", value: timeLeft.hours },
        { label: "MENIT", value: timeLeft.minutes },
        { label: "DETIK", value: timeLeft.seconds }
      ].map((item, index) => (
        <motion.div 
          key={item.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
          className="glass border border-white/20 dark:border-slate-700/50 rounded-xl p-4 min-w-[80px] md:min-w-[100px] text-center shadow-lg"
        >
          <div className="text-3xl md:text-4xl font-bold text-white mb-1">
            {item.value.toString().padStart(2, '0')}
          </div>
          <div className="text-[10px] md:text-xs font-semibold tracking-widest text-white/70">
            {item.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

interface CountdownProps {
  targetDate: string; // ISO String format
}

export function CountdownTimer({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (
        newTimeLeft.days === 0 &&
        newTimeLeft.hours === 0 &&
        newTimeLeft.minutes === 0 &&
        newTimeLeft.seconds === 0
      ) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const items = [
    { label: 'HARI', value: timeLeft.days },
    { label: 'JAM', value: timeLeft.hours },
    { label: 'MNT', value: timeLeft.minutes },
    { label: 'DTK', value: timeLeft.seconds },
  ];

  return (
    <View className="flex-row justify-center space-x-2 gap-2 mt-4">
      {items.map((item, idx) => (
        <View key={idx} className="items-center">
          <View className="w-16 h-16 bg-white/20 border border-white/30 rounded-2xl items-center justify-center shadow-sm">
            <Text className="text-2xl font-black text-white">
              {item.value.toString().padStart(2, '0')}
            </Text>
          </View>
          <Text className="text-xs font-bold text-blue-100 mt-2 tracking-wider">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

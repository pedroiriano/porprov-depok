"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Mencegah hydration mismatch dengan menunggu komponen di-mount di klien
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md opacity-0">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm overflow-hidden flex items-center justify-center transition-colors"
      aria-label="Toggle Dark Mode"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "dark" ? (
          <motion.div
            key="dark"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-amber-400 drop-shadow-md" />
          </motion.div>
        ) : (
          <motion.div
            key="light"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-slate-700 drop-shadow-md" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

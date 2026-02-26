import { useState, useEffect } from 'react';

export function useCountdown(initialSeconds: number | null) {
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (!remaining || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remaining]);

  // Update remaining when initialSeconds changes
  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  return remaining;
}

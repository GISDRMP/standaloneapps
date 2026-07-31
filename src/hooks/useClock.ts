import { useEffect, useMemo, useRef, useState } from 'react';

const STARTING_COUNTDOWN_SECONDS = 2 * 60 * 60 + 14 * 60 + 35;

const formatUnit = (value: number) => value.toString().padStart(2, '0');

export const useClock = () => {
  const startedAt = useRef(Date.now());
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const elapsed = Math.floor((now.getTime() - startedAt.current) / 1000);
    const elapsedInCycle = elapsed % STARTING_COUNTDOWN_SECONDS;
    const remaining = STARTING_COUNTDOWN_SECONDS - elapsedInCycle;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    return `T - ${formatUnit(hours)}:${formatUnit(minutes)}:${formatUnit(seconds)}`;
  }, [now]);

  return { now, countdown };
};

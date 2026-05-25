// utils/attendanceUtils.ts
export const calculateNetHours = (clockIn: string, clockOut: string, breakStart?: string, breakEnd?: string): number => {
  if (!clockIn || !clockOut) return 0;

  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();
  let durationMs = end - start;

  // Subtract break time if both break start and end exist
  if (breakStart && breakEnd) {
    const bStart = new Date(breakStart).getTime();
    const bEnd = new Date(breakEnd).getTime();
    durationMs -= (bEnd - bStart);
  }

  const hours = durationMs / (1000 * 60 * 60);
  return Math.max(0, hours); // Ensure we don't return negative hours
};

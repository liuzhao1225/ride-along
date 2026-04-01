/** 活动仅展示到「日」（不含时刻） */
export function formatActivityDateDisplay(seconds: number | null): string | null {
  if (seconds == null) return null;
  return new Date(seconds * 1000).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** 将 `<input type="date">` 的 YYYY-MM-DD 转为存库的 ISO（按东八区当日 0 点） */
export function eventDateInputToIso(dateStr: string): string | null {
  const s = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function activitySecondsToDateInput(seconds: number | null): string {
  if (seconds == null) return "";
  const d = new Date(seconds * 1000);
  if (Number.isNaN(d.getTime())) return "";
  const offsetMs = 8 * 60 * 60 * 1000;
  const cst = new Date(d.getTime() + offsetMs);
  return cst.toISOString().slice(0, 10);
}

/** 明日日期字符串 YYYY-MM-DD（本地日历日） */
export function defaultEventDateInput(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

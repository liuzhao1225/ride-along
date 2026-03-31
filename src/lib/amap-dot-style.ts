/** 有车 / 已上车 */
export const MAP_DOT_GREEN = "#22c55e";
/** 未上车乘客 */
export const MAP_DOT_RED = "#ef4444";
export const MAP_DOT_NEUTRAL = "#64748b";

/**
 * 人物/目的地圆点在屏幕上的固定像素大小，不随地图缩放级别变化，
 * 全局缩小时仍能看清标记。
 */
export const MAP_DOT_SCREEN_PX = 12;

export type MapDotKind = "green" | "red" | "neutral";

export function dotColor(kind: MapDotKind): string {
  if (kind === "green") return MAP_DOT_GREEN;
  if (kind === "red") return MAP_DOT_RED;
  return MAP_DOT_NEUTRAL;
}

/** Marker offset：使圆点中心对准经纬度（配合 content 使用） */
export function mapDotMarkerOffsetPx(): [number, number] {
  const h = MAP_DOT_SCREEN_PX / 2;
  return [-h, -h];
}

/**
 * 仅纯色圆点，无文字，避免自定义标签在缩放时改变 DOM 尺寸导致锚点偏移。
 */
export function createPersonDotElement(
  color: string,
  dotPx: number = MAP_DOT_SCREEN_PX
): HTMLDivElement {
  const dot = document.createElement("div");
  dot.setAttribute("data-amap-dot", "1");
  dot.style.boxSizing = "border-box";
  dot.style.width = `${dotPx}px`;
  dot.style.height = `${dotPx}px`;
  dot.style.borderRadius = "50%";
  dot.style.background = color;
  dot.style.border = "none";
  dot.style.boxShadow = "none";
  dot.style.flexShrink = "0";
  return dot;
}

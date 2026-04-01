/** 有车 / 已上车 */
export const MAP_DOT_GREEN = "#8fcf9f";
/** 未上车乘客 */
export const MAP_DOT_RED = "#ef4444";
export const MAP_DOT_NEUTRAL = "#64748b";
export const MAP_STAR_GREEN = "#22c55e";
export const MAP_STAR_SCREEN_PX = 24;

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

/** Marker offset：使 marker 中心对准经纬度（配合 content 使用） */
export function mapDotMarkerOffsetPx(
  markerPx: number = MAP_DOT_SCREEN_PX
): [number, number] {
  const h = markerPx / 2;
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

export function createPersonStarElement(
  color: string,
  starPx: number = MAP_STAR_SCREEN_PX
): HTMLDivElement {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-amap-star", "1");
  wrapper.style.boxSizing = "border-box";
  wrapper.style.width = `${starPx}px`;
  wrapper.style.height = `${starPx}px`;
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.flexShrink = "0";

  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("width", `${starPx}`);
  svg.setAttribute("height", `${starPx}`);

  const polygon = document.createElementNS(svgNs, "polygon");
  polygon.setAttribute(
    "points",
    "50,5 61,36 95,36 67,55 78,88 50,69 22,88 33,55 5,36 39,36"
  );
  polygon.setAttribute("fill", color);
  polygon.setAttribute("stroke", "#ffffff");
  polygon.setAttribute("stroke-width", "7");
  polygon.setAttribute("stroke-linejoin", "round");

  svg.appendChild(polygon);
  wrapper.appendChild(svg);
  return wrapper;
}

import type { Shape } from '$lib/store/canvasStore';

const SNAP_THRESHOLD = 5; // 스냅 거리 임계값

export function snapPosition(movingShape: Shape, allShapes: Shape[]): { x: number; y: number } {
  let { x, y, width = 0, height = 0 } = movingShape;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  let snapX = x;
  let snapY = y;

  allShapes.forEach(shape => {
    if (shape.id === movingShape.id) return;

    const sWidth = shape.width || 0;
    const sHeight = shape.height || 0;
    const sCenterX = shape.x + sWidth / 2;
    const sCenterY = shape.y + sHeight / 2;

    // 엣지 스냅 (left, right, top, bottom)
    if (Math.abs(x - shape.x) < SNAP_THRESHOLD) snapX = shape.x;
    if (Math.abs(x + width - (shape.x + sWidth)) < SNAP_THRESHOLD) snapX = shape.x + sWidth - width;
    if (Math.abs(y - shape.y) < SNAP_THRESHOLD) snapY = shape.y;
    if (Math.abs(y + height - (shape.y + sHeight)) < SNAP_THRESHOLD) snapY = shape.y + sHeight - height;

    // 센터 스냅
    if (Math.abs(centerX - sCenterX) < SNAP_THRESHOLD) snapX = sCenterX - width / 2;
    if (Math.abs(centerY - sCenterY) < SNAP_THRESHOLD) snapY = sCenterY - height / 2;
  });

  return { x: snapX, y: snapY };
}
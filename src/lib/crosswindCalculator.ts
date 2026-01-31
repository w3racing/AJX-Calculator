/**
 * Crosswind and headwind from runway heading and wind (direction FROM which wind blows, speed in knots).
 * Angles in degrees: runway 0–360, wind 0–360.
 * crosswind: positive = from left, negative = from right
 * headwind: positive = headwind, negative = tailwind
 */
export function crosswindHeadwind(
  runwayHeadingDeg: number,
  windDirectionDeg: number,
  windSpeedKt: number
): { crosswindKt: number; headwindKt: number } {
  const angleDeg = (windDirectionDeg - runwayHeadingDeg + 540) % 360 - 180
  const angleRad = (angleDeg * Math.PI) / 180
  const crosswindKt = windSpeedKt * Math.sin(angleRad)
  const headwindKt = -windSpeedKt * Math.cos(angleRad)
  return { crosswindKt, headwindKt }
}

export function crosswindMagnitudeKt(crosswindKt: number): number {
  return Math.abs(crosswindKt)
}

export function crosswindFromLeft(crosswindKt: number): boolean {
  return crosswindKt > 0
}

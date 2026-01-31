/**
 * Wheels Up Time Calculator
 * Calculates when to depart (wheels up) to arrive at destination
 * before airport closes or after airport opens.
 * All times in UTC. Taxi-in and sign-off time are not included.
 */

export interface WheelsUpInputs {
  /** Target time (airport open or close) in UTC as "HH:mm" (24h) */
  targetTimeUtc: string
  /** Planned flight time in hours */
  flightTimeHours: number
  /** Planned flight time in minutes */
  flightTimeMinutes: number
}

export interface WheelsUpResult {
  /** Wheels up time in UTC as "HH:mm" */
  wheelsUpTimeUtc: string
  /** True if wheels up is on the previous calendar day */
  previousDay: boolean
}

const MINUTES_PER_DAY = 24 * 60

/**
 * Parse "HH:mm" or "H:mm" into minutes since midnight.
 */
function parseTimeToMinutes(time: string): number | null {
  const trimmed = time.trim()
  if (!trimmed) return null
  const [h, m] = trimmed.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

/**
 * Format minutes since midnight as "HH:mm".
 */
function formatMinutesAsTime(min: number): string {
  const normalized = ((min % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  const h = Math.floor(normalized / 60) % 24
  const m = Math.round(normalized % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Calculate wheels up time (UTC) to arrive at target time.
 * Wheels up = Target arrival time - Flight time
 *
 * @param inputs - Target time, flight duration, and arrival target type
 * @returns Wheels up time and whether it falls on the previous day, or null if invalid
 */
export function calculateWheelsUp(inputs: WheelsUpInputs): WheelsUpResult | null {
  const { targetTimeUtc, flightTimeHours, flightTimeMinutes } = inputs

  const targetMin = parseTimeToMinutes(targetTimeUtc)
  if (targetMin === null) return null

  const flightTotalMinutes = flightTimeHours * 60 + flightTimeMinutes
  if (flightTotalMinutes <= 0) return null

  // Wheels up = target - flight
  let wheelsUpMin = targetMin - flightTotalMinutes
  let previousDay = false

  if (wheelsUpMin < 0) {
    wheelsUpMin += MINUTES_PER_DAY
    previousDay = true
  }

  return {
    wheelsUpTimeUtc: formatMinutesAsTime(wheelsUpMin),
    previousDay,
  }
}

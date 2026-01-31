/**
 * AJX 3-Crew Composition – Flight time recording for company portal
 * Based on: How to record flight time in multiple composition (20NOV 2023)
 * and user CSV: CAP/CAPM/COP table with DUTY OPR, NIGHT, OTHER DUTY OPR, NIGHT, IMC
 */

export type CompositionType = 'normal' | 'captain-expansion' | 'copilot-expansion'

export type FlightTimeInputMode = 'total' | 'block'

/** Total minutes from hours + minutes */
export function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + Math.max(0, Math.min(59, Math.round(minutes)))
}

/** Format minutes as hh:mm (e.g. 563 → "9:23") */
export function formatMinutesAsHHMM(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return '0:00'
  const m = Math.round(totalMinutes) % 60
  const h = Math.floor(Math.round(totalMinutes) / 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Parse "h:mm" or "hh:mm" to total minutes */
export function parseHHMM(value: string): number {
  const parts = value.trim().split(':').map(Number)
  if (parts.length < 2 || parts.some(Number.isNaN)) return 0
  const [h, m] = parts
  return Math.max(0, h * 60 + Math.round(m))
}

export interface CrewCompositionInput {
  /** Total block (flight) time in minutes */
  blockMinutes: number
  /** Total NIGHT time in minutes */
  nightMinutes: number
  /** Total IMC time in minutes */
  imcMinutes: number
  compositionType: CompositionType
}

/** One cell in the portal table: value as hh:mm or null (greyed) */
export type PortalCell = string | null

/** One row: CAP, CAPM, or COP. Columns: DUTY OPR, DUTY NIGHT, OTHER OPR, OTHER NIGHT, IMC */
export interface PortalRow {
  role: 'CAP' | 'CAPM' | 'COP'
  dutyOpr: PortalCell
  dutyNight: PortalCell
  otherOpr: PortalCell
  otherNight: PortalCell
  imc: PortalCell
}

export interface PortalTable {
  rows: PortalRow[]
  /** Total flight time displayed as hh:mm */
  totalBlockFormatted: string
}

function toHHMM(minutes: number): string {
  return formatMinutesAsHHMM(minutes)
}

/**
 * Compute portal table for 3-crew (CAP, CAPM, COP).
 * Which role has the "1/3 + 1/3" (OTHER DUTY) split depends on composition type:
 * - Normal: CAPM (monitoring pilot on rest) has the split.
 * - Captain area expansion: CAP (captain on rest) has the split.
 * - Co-pilot area expansion: COP (co-pilot on rest) has the split.
 * The other two roles always get 2/3 in DUTY only. IMC: 2/3 total each for all.
 */
export function crewCompositionToPortalTable(input: CrewCompositionInput): PortalTable {
  const { blockMinutes, nightMinutes, imcMinutes, compositionType } = input

  const oneThirdBlock = Math.round(blockMinutes / 3)
  const twoThirdsBlock = Math.round((blockMinutes * 2) / 3)
  const twoThirdsNight = Math.round((nightMinutes * 2) / 3)
  const oneThirdNight = Math.round(nightMinutes / 3)
  const imcPerPerson = Math.round((imcMinutes * 2) / 3)

  const dutyOnly = {
    dutyOpr: toHHMM(twoThirdsBlock),
    dutyNight: toHHMM(twoThirdsNight),
    otherOpr: null as PortalCell,
    otherNight: null as PortalCell,
    imc: toHHMM(imcPerPerson),
  }
  const dutyAndOther = {
    dutyOpr: toHHMM(oneThirdBlock),
    dutyNight: toHHMM(oneThirdNight),
    otherOpr: toHHMM(oneThirdBlock),
    otherNight: toHHMM(oneThirdNight),
    imc: toHHMM(imcPerPerson),
  }

  const whoHasSplit =
    compositionType === 'captain-expansion'
      ? 'CAP'
      : compositionType === 'copilot-expansion'
        ? 'COP'
        : 'CAPM'

  const rows: PortalRow[] = [
    {
      role: 'CAP',
      ...(whoHasSplit === 'CAP' ? dutyAndOther : dutyOnly),
    },
    {
      role: 'CAPM',
      ...(whoHasSplit === 'CAPM' ? dutyAndOther : dutyOnly),
    },
    {
      role: 'COP',
      ...(whoHasSplit === 'COP' ? dutyAndOther : dutyOnly),
    },
  ]

  return {
    rows,
    totalBlockFormatted: toHHMM(blockMinutes),
  }
}

/**
 * Compute total block from off-block and on-block times (same day).
 * Off and on are total minutes since midnight (e.g. 9*60+0 = 540 for 09:00).
 */
export function blockFromOffOn(offMinutes: number, onMinutes: number): number {
  let diff = onMinutes - offMinutes
  if (diff < 0) diff += 24 * 60 // next day
  return Math.max(0, diff)
}

/** Divisible-by-3 minutes reference: rows of [3,18,33,48], [6,21,...], etc. */
export const DIVISIBLE_BY_3_MINUTES: number[][] = [
  [3, 18, 33, 48],
  [6, 21, 36, 51],
  [9, 24, 39, 54],
  [12, 27, 42, 57],
  [15, 30, 45, 60],
]

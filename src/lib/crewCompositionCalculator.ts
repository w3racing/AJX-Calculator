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

/** Parse "h:mm", "hh:mm" or "hhmm" to total minutes */
export function parseHHMM(value: string): number {
  const s = value.trim()
  if (!s) return 0

  if (s.includes(':')) {
    const parts = s.split(':').map(Number)
    if (parts.length < 2 || parts.some(Number.isNaN)) return 0
    const [h, m] = parts
    return Math.max(0, h * 60 + Math.round(m))
  }

  const digits = s.replace(/\D/g, '')
  if (digits.length === 0) return 0
  if (digits.length === 1) return Math.max(0, parseInt(digits, 10) * 60)
  if (digits.length === 2) return Math.max(0, parseInt(digits, 10) * 60)
  if (digits.length === 3) {
    const h = parseInt(digits.slice(0, 1), 10)
    const m = parseInt(digits.slice(1, 3), 10)
    return Math.max(0, h * 60 + Math.min(59, m))
  }
  const h = parseInt(digits.slice(0, 2), 10)
  const m = parseInt(digits.slice(2, 4), 10)
  return Math.max(0, h * 60 + Math.min(59, m))
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

/** Area expansion row: AQTR/AQTE/CAPM (captain) or OFTR/OFTE/CAPM (copilot). Same column structure as normal. */
export interface AreaExpansionRow {
  code: string
  dutyOpr: PortalCell
  dutyNight: PortalCell
  otherOpr: PortalCell
  otherNight: PortalCell
  imc: PortalCell
}

export interface PortalTableNormal {
  format: 'normal'
  rows: PortalRow[]
  totalBlockFormatted: string
}

export interface PortalTableAreaExpansion {
  format: 'area-expansion'
  rows: AreaExpansionRow[]
  totalBlockFormatted: string
  expansionType: 'captain' | 'copilot'
}

export type PortalTable = PortalTableNormal | PortalTableAreaExpansion

function toHHMM(minutes: number): string {
  return formatMinutesAsHHMM(minutes)
}

/**
 * Compute portal table for 3-crew.
 * - Normal: CAP/CAPM/COP with DUTY OPR, NIGHT, OTHER DUTY OPR, NIGHT, IMC.
 * - Captain area expansion: AQTR/AQTE/CAPM with DUTY, OTHER DUTY (per spec: 4/6, 2/6+2/6, 2/6+2/6).
 * - Co-pilot area expansion: OFTR/OFTE/CAPM with DUTY, OTHER DUTY (per spec: 4/6, 4/6, 2/6+2/6).
 */
export function crewCompositionToPortalTable(input: CrewCompositionInput): PortalTable {
  const { blockMinutes, nightMinutes, imcMinutes, compositionType } = input

  const oneThirdBlock = Math.round(blockMinutes / 3)
  const twoThirdsBlock = Math.round((blockMinutes * 2) / 3)
  const twoThirdsNight = Math.round((nightMinutes * 2) / 3)
  const oneThirdNight = Math.round(nightMinutes / 3)
  const imcPerPerson = Math.round((imcMinutes * 2) / 3)

  if (compositionType === 'captain-expansion') {
    // Captain area expansion: AQTR 4/6 duty, AQTE 2/6+2/6, CAPM 2/6+2/6. NIGHT & IMC use same fractions.
    const fourSixthsBlock = Math.round((blockMinutes * 4) / 6)
    const twoSixthsBlock = Math.round((blockMinutes * 2) / 6)
    const fourSixthsNight = Math.round((nightMinutes * 4) / 6)
    const twoSixthsNight = Math.round((nightMinutes * 2) / 6)
    const imcPerPerson = Math.round((imcMinutes * 2) / 3)
    return {
      format: 'area-expansion',
      expansionType: 'captain',
      rows: [
        { code: 'AQTR', dutyOpr: toHHMM(fourSixthsBlock), dutyNight: toHHMM(fourSixthsNight), otherOpr: null, otherNight: null, imc: toHHMM(imcPerPerson) },
        { code: 'AQTE', dutyOpr: toHHMM(twoSixthsBlock), dutyNight: toHHMM(twoSixthsNight), otherOpr: toHHMM(twoSixthsBlock), otherNight: toHHMM(twoSixthsNight), imc: toHHMM(imcPerPerson) },
        { code: 'CAPM', dutyOpr: toHHMM(twoSixthsBlock), dutyNight: toHHMM(twoSixthsNight), otherOpr: toHHMM(twoSixthsBlock), otherNight: toHHMM(twoSixthsNight), imc: toHHMM(imcPerPerson) },
      ],
      totalBlockFormatted: toHHMM(blockMinutes),
    }
  }

  if (compositionType === 'copilot-expansion') {
    // Co-pilot area expansion: OFTR 4/6 duty, OFTE 4/6 duty, CAPM 2/6+2/6. NIGHT & IMC use same fractions.
    const fourSixthsBlock = Math.round((blockMinutes * 4) / 6)
    const twoSixthsBlock = Math.round((blockMinutes * 2) / 6)
    const fourSixthsNight = Math.round((nightMinutes * 4) / 6)
    const twoSixthsNight = Math.round((nightMinutes * 2) / 6)
    const imcPerPerson = Math.round((imcMinutes * 2) / 3)
    return {
      format: 'area-expansion',
      expansionType: 'copilot',
      rows: [
        { code: 'OFTR', dutyOpr: toHHMM(fourSixthsBlock), dutyNight: toHHMM(fourSixthsNight), otherOpr: null, otherNight: null, imc: toHHMM(imcPerPerson) },
        { code: 'OFTE', dutyOpr: toHHMM(fourSixthsBlock), dutyNight: toHHMM(fourSixthsNight), otherOpr: null, otherNight: null, imc: toHHMM(imcPerPerson) },
        { code: 'CAPM', dutyOpr: toHHMM(twoSixthsBlock), dutyNight: toHHMM(twoSixthsNight), otherOpr: toHHMM(twoSixthsBlock), otherNight: toHHMM(twoSixthsNight), imc: toHHMM(imcPerPerson) },
      ],
      totalBlockFormatted: toHHMM(blockMinutes),
    }
  }

  // Normal composition: CAP, CAPM, COP with full column set
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

  const rows: PortalRow[] = [
    { role: 'CAP', ...dutyOnly },
    { role: 'CAPM', ...dutyAndOther },
    { role: 'COP', ...dutyOnly },
  ]

  return {
    format: 'normal',
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

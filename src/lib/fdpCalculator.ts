/**
 * AJX Flight Duty Period (FDP) Calculator
 * Based on AJX Operations Manual 8-5 Duty Time and Rest of Crew Member
 * REV: No.40, EFF: 2025.6.5
 */

export type CrewCompliment = 'standard' | '3-crew' | '4-crew';

/** Rest facility class for 3/4 crew (affects FDP limit). Class 1 = best. */
export type RestFacilityClass = 1 | 2 | 3;

/**
 * Labels and descriptions for in-flight rest facility classes (3/4 crew).
 */
export const REST_FACILITY_CLASS_INFO: Record<
  RestFacilityClass,
  { label: string; description: string }
> = {
  1: {
    label: 'Class 1',
    description:
      'Class 1 rest facility: bunk or equivalent that allows horizontal sleep (e.g. crew rest compartment with lie-flat bed).',
  },
  2: {
    label: 'Class 2',
    description:
      'Class 2 rest facility: reclining seat with leg support, in an area separated from passengers and flight deck (e.g. dedicated crew seat).',
  },
  3: {
    label: 'Class 3',
    description:
      'Class 3 rest facility: seat in the passenger cabin (e.g. business class seat). No dedicated crew rest area.',
  },
};

export interface FDPInputs {
  /** Report time (FDP start) as "HH:mm" (24h) at crew-acclimated location */
  reportTime: string;
  /** Number of sectors (scheduled flights) in the duty period */
  sectors: number;
  crewCompliment: CrewCompliment;
  /** For 3/4 crew only: in-flight rest facility class. Default Class 1. */
  restFacilityClass?: RestFacilityClass;
}

export interface FDPResult {
  /** Max flight duty time (block time) in hours */
  maxFlightDutyTimeHours: number;
  /** Max flight duty period in hours (report to release) */
  maxFlightDutyPeriodHours: number;
  /** Human-readable report time window used for the limit */
  reportTimeWindow: string;
  /** Source reference (e.g. "2-pilot", "3-pilot Class 1") */
  source: string;
}

/**
 * Parse "HH:mm" or "H:mm" into minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.trim().split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return Math.max(0, Math.min(24 * 60 - 1, h * 60 + m));
}

/**
 * Get the FDP start time band for two-pilot (standard) limits.
 * Manual Table C: Start of Flight Duty Period (acclimated time).
 */
function getStandardFDPBand(reportTime: string): keyof typeof STANDARD_FDP_TABLE | null {
  const min = parseTimeToMinutes(reportTime);
  if (min >= 0 && min < 5 * 60) return '00:00-04:59';
  if (min >= 5 * 60 && min < 6 * 60) return '05:00-05:59';
  if (min >= 6 * 60 && min < 14 * 60) return '06:00-13:59';
  if (min >= 14 * 60 && min < 16 * 60) return '14:00-15:59';
  if (min >= 16 * 60 && min < 24 * 60) return '16:00-23:59';
  return null;
}

/**
 * Two-pilot FDP limits (hours) by start time and number of flights (1–10).
 * Manual 8-5-1 ②(1)1)C.
 */
const STANDARD_FDP_TABLE: Record<string, number[]> = {
  '00:00-04:59': [11, 10.5, 10, 9.5, 9, 9, 9, 9, 9, 9],
  '05:00-05:59': [12, 11.5, 11, 10.5, 10, 9.5, 9, 9, 9, 9],
  '06:00-13:59': [13, 12.5, 12, 11.5, 11, 10.5, 10, 9.5, 9, 9],
  '14:00-15:59': [12, 11.5, 11, 10.5, 10, 9.5, 9, 9, 9, 9],
  '16:00-23:59': [11, 10.5, 10, 9.5, 9, 9, 9, 9, 9, 9],
};

/**
 * Two-pilot flight duty time limits (hours) by FDP start and sector count.
 * Manual 8-5-1 ②(1)1)B.
 */
function getStandardFDTLimit(reportTime: string, sectors: number): number {
  const min = parseTimeToMinutes(reportTime);
  const threeOrMore = sectors >= 3;
  if (min >= 0 && min < 5 * 60) return threeOrMore ? 8 : 9;
  if (min >= 5 * 60 && min < 17 * 60) return threeOrMore ? 9 : 10;
  return threeOrMore ? 8 : 9; // 17:00-23:59
}

/**
 * 3-pilot / 4-pilot FDP limits (hours) by rest facility and sector count.
 * Manual 8-5-1 ②(1)2)C.
 */
const MULTI_CREW_FDP: Record<CrewCompliment, Record<RestFacilityClass, { twoOrLess: number; threeOrMore: number }>> = {
  'standard': { 1: { twoOrLess: 0, threeOrMore: 0 }, 2: { twoOrLess: 0, threeOrMore: 0 }, 3: { twoOrLess: 0, threeOrMore: 0 } },
  '3-crew': {
    1: { twoOrLess: 17, threeOrMore: 16 },
    2: { twoOrLess: 16, threeOrMore: 15 },
    3: { twoOrLess: 15, threeOrMore: 14 },
  },
  '4-crew': {
    1: { twoOrLess: 18, threeOrMore: 17 },
    2: { twoOrLess: 17, threeOrMore: 16 },
    3: { twoOrLess: 16, threeOrMore: 15 },
  },
};

/** 3/4 crew max flight duty time (block) in hours. Manual 8-5-1 ②(1)2)B. */
const MULTI_CREW_FDT: Record<CrewCompliment, number> = {
  'standard': 0,
  '3-crew': 15,
  '4-crew': 17,
};

/**
 * Map sector count (1–10) to FDP table column index.
 * Manual table columns: 1–2 flights, 3, 4, 5, 6, 7, 8, 9, 10 flights → indices 0–9.
 */
function sectorCountToFDPColumnIndex(sectors: number): number {
  const s = Math.max(1, Math.min(10, Math.floor(sectors)));
  if (s <= 2) return 0; // 1–2 flights → index 0
  if (s >= 10) return 9; // 10 flights → index 9
  return s - 2; // 3→1, 4→2, 5→3, ..., 9→7
}

/**
 * Calculate maximum FDP and FDT for the given inputs.
 */
export function calculateFDP(inputs: FDPInputs): FDPResult | null {
  const { reportTime, sectors, crewCompliment, restFacilityClass = 1 } = inputs;
  const sectorIndex = sectorCountToFDPColumnIndex(sectors);

  if (crewCompliment === 'standard') {
    const band = getStandardFDPBand(reportTime);
    if (!band) return null;
    const fdpRow = STANDARD_FDP_TABLE[band];
    const maxFDP = fdpRow[sectorIndex];
    const maxFDT = getStandardFDTLimit(reportTime, sectors);
    return {
      maxFlightDutyTimeHours: maxFDT,
      maxFlightDutyPeriodHours: maxFDP,
      reportTimeWindow: band,
      source: '2-pilot',
    };
  }

  const limits = MULTI_CREW_FDP[crewCompliment][restFacilityClass as RestFacilityClass];
  const twoOrLess = sectors <= 2;
  const maxFDP = twoOrLess ? limits.twoOrLess : limits.threeOrMore;
  const maxFDT = MULTI_CREW_FDT[crewCompliment];
  const crewLabel = crewCompliment === '3-crew' ? '3-pilot' : '4-pilot';
  return {
    maxFlightDutyTimeHours: maxFDT,
    maxFlightDutyPeriodHours: maxFDP,
    reportTimeWindow: reportTime,
    source: `${crewLabel} Class ${restFacilityClass}`,
  };
}

/**
 * Format hours (e.g. 10.5) as "10h 30m" or "10 hours".
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Standard sign-off time after on chocks (minutes). */
const SIGN_OFF_AFTER_ON_CHOCKS_MIN = 50

/**
 * Latest wheels-up time for the final sector so FDP ends legally.
 * FDP ends at sign-off; sign-off = on chocks + 50 min; on chocks = landing + destination taxi.
 * So: sign-off = wheels up + block + destination taxi + 50 min, and sign-off ≤ report + maxFDP.
 * Hence: latest wheels up = report + maxFDP - block - destination taxi - 50 min.
 *
 * @param reportTime - FDP start "HH:mm"
 * @param maxFDPHours - Max flight duty period in hours
 * @param finalSectorFlightHours - Block time of the last sector in hours
 * @param destinationTaxiMinutes - Taxi time at destination (minutes), default 0
 * @returns Latest wheels-up time and whether it falls on the next calendar day
 */
export function latestWheelsUp(
  reportTime: string,
  maxFDPHours: number,
  finalSectorFlightHours: number,
  destinationTaxiMinutes: number = 0
): { time: string; nextDay: boolean } | null {
  const reportMin = parseTimeToMinutes(reportTime);
  const fdpEndMin = reportMin + maxFDPHours * 60;
  const blockMin = finalSectorFlightHours * 60;
  const totalAfterWheelsUp = blockMin + destinationTaxiMinutes + SIGN_OFF_AFTER_ON_CHOCKS_MIN;
  const wheelsUpMin = fdpEndMin - totalAfterWheelsUp;
  if (finalSectorFlightHours <= 0 || totalAfterWheelsUp > maxFDPHours * 60) return null;
  const displayMin = ((wheelsUpMin % 1440) + 1440) % 1440;
  const h = Math.floor(displayMin / 60) % 24;
  const m = Math.round(displayMin % 60);
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const nextDay = reportMin + maxFDPHours * 60 >= 1440;
  return { time, nextDay };
}

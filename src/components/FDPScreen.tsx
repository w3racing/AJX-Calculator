import { useState, useEffect } from 'react'
import {
  calculateFDP,
  formatHours,
  latestWheelsUp,
  parseTimeToMinutes,
  REST_FACILITY_CLASS_INFO,
  type CrewCompliment,
  type FDPResult,
  type RestFacilityClass,
} from '../lib/fdpCalculator'

/** Format minutes as "Xh Ym" or "Xh" / "Ym". */
function formatMinutes(m: number): string {
  if (m <= 0) return '0m'
  const h = Math.floor(m / 60)
  const min = Math.round(m % 60)
  if (h === 0) return `${min}m`
  if (min === 0) return `${h}h`
  return `${h}h ${min}m`
}

const CREW_OPTIONS: { value: CrewCompliment; label: string }[] = [
  { value: 'standard', label: 'Standard (2-pilot)' },
  { value: '3-crew', label: '3-Crew' },
  { value: '4-crew', label: '4-Crew' },
]

/** Report time timezone: default JST, then UTC, then other offsets. */
const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'UTC+9', label: 'UTC+9 (JST)' },
  { value: 'UTC+0', label: 'UTC+0 (UTC)' },
  { value: 'UTC+12', label: 'UTC+12' },
  { value: 'UTC+11', label: 'UTC+11' },
  { value: 'UTC+10', label: 'UTC+10' },
  { value: 'UTC+8', label: 'UTC+8' },
  { value: 'UTC+7', label: 'UTC+7' },
  { value: 'UTC+6', label: 'UTC+6' },
  { value: 'UTC+5:30', label: 'UTC+5:30' },
  { value: 'UTC+5', label: 'UTC+5' },
  { value: 'UTC+4', label: 'UTC+4' },
  { value: 'UTC+3', label: 'UTC+3' },
  { value: 'UTC+2', label: 'UTC+2' },
  { value: 'UTC+1', label: 'UTC+1' },
  { value: 'UTC-1', label: 'UTC−1' },
  { value: 'UTC-2', label: 'UTC−2' },
  { value: 'UTC-3', label: 'UTC−3' },
  { value: 'UTC-4', label: 'UTC−4' },
  { value: 'UTC-5', label: 'UTC−5' },
  { value: 'UTC-6', label: 'UTC−6' },
  { value: 'UTC-7', label: 'UTC−7' },
  { value: 'UTC-8', label: 'UTC−8' },
  { value: 'UTC-9', label: 'UTC−9' },
  { value: 'UTC-10', label: 'UTC−10' },
  { value: 'UTC-11', label: 'UTC−11' },
  { value: 'UTC-12', label: 'UTC−12' },
]

function pad2(n: number): string {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0')
}

function clampHour(n: number): number {
  return Math.max(0, Math.min(23, Math.floor(n)))
}
function clampMinute(n: number): number {
  return Math.max(0, Math.min(59, Math.floor(n)))
}

/** Parse timezone value (e.g. "UTC+9", "UTC-5", "UTC+5:30") to offset in minutes (positive = ahead of UTC). */
function timezoneOffsetMinutes(tzValue: string): number {
  const m = tzValue.match(/^UTC([+-])(\d+)(?::(\d+))?$/)
  if (!m) return 0
  const sign = m[1] === '+' ? 1 : -1
  const hours = parseInt(m[2], 10)
  const minutes = parseInt(m[3] ?? '0', 10)
  return sign * (hours * 60 + minutes)
}

/** Convert local wheels-up time (in report timezone) to UTC time string and day indicator. */
function localWheelsUpToUtc(
  time: string,
  nextDay: boolean,
  tzOffsetMinutes: number
): { utcTime: string; utcNextDay: boolean; utcPrevDay: boolean } {
  const localMin = (nextDay ? 24 * 60 : 0) + parseTimeToMinutes(time)
  let utcMin = localMin - tzOffsetMinutes
  const utcPrevDay = utcMin < 0
  const utcNextDay = utcMin >= 24 * 60
  if (utcPrevDay) utcMin += 24 * 60
  if (utcNextDay) utcMin -= 24 * 60
  const h = Math.floor(utcMin / 60) % 24
  const min = Math.round(utcMin % 60)
  const utcTime = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  return { utcTime, utcNextDay, utcPrevDay }
}

export function FDPScreen() {
  const now = new Date()
  const [reportHourInput, setReportHourInput] = useState(pad2(now.getHours()))
  const [reportMinuteInput, setReportMinuteInput] = useState(pad2(now.getMinutes()))
  const [reportTimezone, setReportTimezone] = useState('UTC+9')
  const [sectorsInput, setSectorsInput] = useState('1')
  const [crewCompliment, setCrewCompliment] = useState<CrewCompliment>('standard')
  const [restFacilityClass, setRestFacilityClass] = useState<RestFacilityClass>(1)
  const [finalSectorHours, setFinalSectorHours] = useState<number | ''>('')
  const [finalSectorMinutes, setFinalSectorMinutes] = useState<number | ''>('')
  const [destinationTaxiMinutes, setDestinationTaxiMinutes] = useState<number | ''>('')
  const [result, setResult] = useState<FDPResult | null>(null)

  const reportHour = (() => {
    const n = parseInt(reportHourInput.replace(/\D/g, ''), 10)
    if (reportHourInput === '' || Number.isNaN(n)) return 0
    return clampHour(n)
  })()
  const reportMinute = (() => {
    const n = parseInt(reportMinuteInput.replace(/\D/g, ''), 10)
    if (reportMinuteInput === '' || Number.isNaN(n)) return 0
    return clampMinute(n)
  })()
  const reportTime = `${pad2(reportHour)}:${pad2(reportMinute)}`

  const sectorsNum = (() => {
    const n = parseInt(sectorsInput.trim(), 10)
    if (sectorsInput.trim() === '' || Number.isNaN(n)) return 1
    return Math.max(1, Math.min(10, n))
  })()

  useEffect(() => {
    const r = calculateFDP({
      reportTime,
      sectors: sectorsNum,
      crewCompliment,
      restFacilityClass,
    })
    setResult(r)
  }, [reportTime, sectorsNum, crewCompliment, restFacilityClass])

  const finalSectorFlightHours =
    (typeof finalSectorHours === 'number' ? finalSectorHours : 0) +
    (typeof finalSectorMinutes === 'number' ? finalSectorMinutes : 0) / 60
  const destTaxiMin = typeof destinationTaxiMinutes === 'number' ? Math.max(0, destinationTaxiMinutes) : 0
  const wheelsUpResult =
    result && finalSectorFlightHours > 0
      ? latestWheelsUp(reportTime, result.maxFlightDutyPeriodHours, finalSectorFlightHours, destTaxiMin)
      : null

  // Timeline bar: total = max FDP. Segments = duty to wheels up | block | taxi | 50 min sign off.
  const SIGN_OFF_MIN = 50
  const totalFDPMin = result ? result.maxFlightDutyPeriodHours * 60 : 0
  const blockMin = finalSectorFlightHours * 60
  const timelineSegments =
    result && wheelsUpResult && totalFDPMin > 0
      ? (() => {
          const reportMin = parseTimeToMinutes(reportTime)
          const wheelsUpClockMin = parseTimeToMinutes(wheelsUpResult.time)
          const dutyToWheelsUpMin =
            wheelsUpResult.nextDay
              ? wheelsUpClockMin + 24 * 60 - reportMin
              : (wheelsUpClockMin - reportMin + 24 * 60) % (24 * 60)
          const taxiMin = destTaxiMin
          const signOffMin = SIGN_OFF_MIN
          const total = dutyToWheelsUpMin + blockMin + taxiMin + signOffMin
          if (total > totalFDPMin) return null
          return [
            { label: 'Duty to wheels up', min: dutyToWheelsUpMin, color: 'bg-amber-400/80 dark:bg-amber-500/70' },
            { label: 'Last sector (block)', min: blockMin, color: 'bg-ios-blue/80 dark:bg-ios-blue/70' },
            { label: 'Destination taxi', min: taxiMin, color: 'bg-neutral-400/70 dark:bg-neutral-500/60' },
            { label: 'Sign off (50 min)', min: signOffMin, color: 'bg-ios-green/80 dark:bg-ios-green/70' },
          ] as const
        })()
      : null

  return (
    <>
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Inputs</h2>
        </div>
        <div className="p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Report time (24h)
            </label>
            <div className="flex gap-3">
              <div className="flex-1 flex gap-2 items-center">
                <label htmlFor="report-h" className="sr-only">Hour</label>
                <input
                  id="report-h"
                  type="text"
                  inputMode="numeric"
                  placeholder="00"
                  value={reportHourInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setReportHourInput(v)
                  }}
                  onBlur={() => {
                    if (reportHourInput === '') {
                      setReportHourInput('00')
                      return
                    }
                    const n = parseInt(reportHourInput, 10)
                    setReportHourInput(pad2(Number.isNaN(n) ? 0 : clampHour(n)))
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                />
                <span className="text-neutral-500 dark:text-neutral-400 shrink-0">:</span>
                <label htmlFor="report-m" className="sr-only">Minute</label>
                <input
                  id="report-m"
                  type="text"
                  inputMode="numeric"
                  placeholder="00"
                  value={reportMinuteInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
                    setReportMinuteInput(v)
                  }}
                  onBlur={() => {
                    if (reportMinuteInput === '') {
                      setReportMinuteInput('00')
                      return
                    }
                    const n = parseInt(reportMinuteInput, 10)
                    setReportMinuteInput(pad2(Number.isNaN(n) ? 0 : clampMinute(n)))
                  }}
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                />
              </div>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Hour (00–23) : Minute (00–59)</p>
          </div>
          <div>
            <label htmlFor="report-tz" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Report time timezone
            </label>
            <select
              id="report-tz"
              value={reportTimezone}
              onChange={(e) => setReportTimezone(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            >
              {TIMEZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Time is relative to this timezone</p>
          </div>
          <div>
            <label htmlFor="sectors" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Number of sectors
            </label>
            <input
              id="sectors"
              type="text"
              inputMode="numeric"
              value={sectorsInput}
              onChange={(e) => setSectorsInput(e.target.value.replace(/\D/g, ''))}
              onBlur={() => {
                if (sectorsInput.trim() === '') {
                  setSectorsInput('1')
                  return
                }
                const n = parseInt(sectorsInput, 10)
                if (!Number.isNaN(n)) setSectorsInput(String(Math.max(1, Math.min(10, n))))
              }}
              placeholder="1–10"
              className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Crew compliment
            </label>
            <div className="grid grid-cols-1 gap-2">
              {CREW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCrewCompliment(opt.value)}
                  className={`h-12 px-4 rounded-xl text-left font-medium transition active:scale-[0.98] ${
                    crewCompliment === opt.value
                      ? 'bg-ios-blue text-white'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          {(crewCompliment === '3-crew' || crewCompliment === '4-crew') && (
            <div>
              <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                In-flight rest facility class
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                Affects max FDP. Select the class that matches the rest facility on this operation.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setRestFacilityClass(cls)}
                    className={`h-12 px-4 rounded-xl text-center font-medium transition active:scale-[0.98] ${
                      restFacilityClass === cls
                        ? 'bg-ios-blue text-white'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
                    }`}
                  >
                    {REST_FACILITY_CLASS_INFO[cls].label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700">
                {REST_FACILITY_CLASS_INFO[restFacilityClass].description}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Final sector flight time (block)
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Optional. Enter to get latest wheels-up for the last sector.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="final-h" className="sr-only">Hours</label>
                <input
                  id="final-h"
                  type="number"
                  min={0}
                  max={24}
                  placeholder="0"
                  value={finalSectorHours === '' ? '' : finalSectorHours}
                  onChange={(e) => setFinalSectorHours(e.target.value === '' ? '' : Math.max(0, Math.min(24, Number(e.target.value))))}
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Hours</span>
              </div>
              <div>
                <label htmlFor="final-m" className="sr-only">Minutes</label>
                <input
                  id="final-m"
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  value={finalSectorMinutes === '' ? '' : finalSectorMinutes}
                  onChange={(e) => setFinalSectorMinutes(e.target.value === '' ? '' : Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Minutes</span>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="dest-taxi" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Destination taxi time (for latest wheels up)
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Taxi time at destination. Sign-off is 50&nbsp;min after on chocks (landing + taxi).
            </p>
            <input
              id="dest-taxi"
              type="number"
              min={0}
              max={120}
              placeholder="0"
              value={destinationTaxiMinutes === '' ? '' : destinationTaxiMinutes}
              onChange={(e) => setDestinationTaxiMinutes(e.target.value === '' ? '' : Math.max(0, Math.min(120, Number(e.target.value))))}
              className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Minutes</span>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Limits</h2>
        </div>
        <div className="p-6">
          {result ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Max flight duty period</p>
                <p className="text-3xl font-semibold text-neutral-900 dark:text-white tabular-nums">
                  {formatHours(result.maxFlightDutyPeriodHours)}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                  Report to release (FDP start: {result.reportTimeWindow})
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Max flight time (block)</p>
                <p className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                  {formatHours(result.maxFlightDutyTimeHours)}
                </p>
              </div>
              {wheelsUpResult && (
                <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800">
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Latest wheels up (final sector)</p>
                  <p className="text-2xl font-semibold text-ios-green dark:text-ios-green tabular-nums">
                    {wheelsUpResult.time}
                    {wheelsUpResult.nextDay && (
                      <span className="text-base font-normal text-neutral-500 dark:text-neutral-400 ml-2">(next day)</span>
                    )}
                    <span className="text-base font-normal text-neutral-500 dark:text-neutral-400 ml-2">
                      {TIMEZONE_OPTIONS.find((z) => z.value === reportTimezone)?.label ?? reportTimezone}
                    </span>
                  </p>
                  {(() => {
                    const tzOffset = timezoneOffsetMinutes(reportTimezone)
                    const { utcTime, utcNextDay, utcPrevDay } = localWheelsUpToUtc(
                      wheelsUpResult.time,
                      wheelsUpResult.nextDay,
                      tzOffset
                    )
                    const utcDayNote = utcNextDay ? ' (next day)' : utcPrevDay ? ' (previous day)' : ''
                    return (
                      <p className="text-2xl font-semibold text-ios-blue dark:text-ios-blue tabular-nums mt-1">
                        {utcTime}
                        <span className="text-base font-normal text-ios-blue dark:text-ios-blue ml-2">UTC</span>
                        {utcDayNote && (
                          <span className="text-base font-normal text-neutral-500 dark:text-neutral-400 ml-2">{utcDayNote}</span>
                        )}
                      </p>
                    )
                  })()}
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    Includes destination taxi and 50&nbsp;min sign-off after on chocks
                  </p>
                </div>
              )}
              {timelineSegments && result && (
                <div className="pt-4 border-t border-neutral-200/60 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Duty in full</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                    Signed on → last wheels up → block → taxi → 50&nbsp;min sign off = max FDP limit
                  </p>
                  <div className="flex w-full rounded-lg overflow-hidden border border-neutral-200/80 dark:border-neutral-700 h-8 bg-neutral-100 dark:bg-neutral-800">
                    {timelineSegments.map((seg) => {
                      const pct = totalFDPMin > 0 ? (seg.min / totalFDPMin) * 100 : 0
                      return (
                        <div
                          key={seg.label}
                          className={`${seg.color} min-w-0 flex-shrink-0 first:rounded-l-md last:rounded-r-md`}
                          style={{ width: `${pct}%` }}
                          title={`${seg.label}: ${formatMinutes(seg.min)}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {timelineSegments.map((seg) => (
                      <span key={seg.label} className="flex items-center gap-1.5">
                        <span className={`inline-block w-2.5 h-2.5 rounded-sm shrink-0 ${seg.color}`} />
                        {seg.label}: {formatMinutes(seg.min)}
                      </span>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    <span>
                      Signed on {reportTime}{' '}
                      ({TIMEZONE_OPTIONS.find((z) => z.value === reportTimezone)?.label ?? reportTimezone})
                    </span>
                    <span>FDP limit {formatHours(result.maxFlightDutyPeriodHours)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400">Enter a valid report time.</p>
          )}
        </div>
      </section>

      <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-6">
        For planning only. Confirm with company scheduling.
      </p>
    </>
  )
}

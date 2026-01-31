import { useState, useMemo } from 'react'
import {
  crewCompositionToPortalTable,
  blockFromOffOn,
  formatMinutesAsHHMM,
  parseHHMM,
  toMinutes,
  DIVISIBLE_BY_3_MINUTES,
  type CompositionType,
  type FlightTimeInputMode,
  type PortalTable,
} from '../lib/crewCompositionCalculator'

const COMPOSITION_OPTIONS: { value: CompositionType; label: string }[] = [
  { value: 'normal', label: 'Normal composition (automatic)' },
  { value: 'captain-expansion', label: 'Captain area expansion training' },
  { value: 'copilot-expansion', label: 'Co-pilot area expansion training' },
]

function toNum(v: number | ''): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : 0
}

export function CrewCompositionScreen() {
  const [compositionType, setCompositionType] = useState<CompositionType>('normal')
  const [flightTimeMode, setFlightTimeMode] = useState<FlightTimeInputMode>('total')

  // Total flight time mode: hours + minutes
  const [totalBlockHours, setTotalBlockHours] = useState<number | ''>('')
  const [totalBlockMinutes, setTotalBlockMinutes] = useState<number | ''>('')

  // Off/on block mode: time strings "HH:mm"
  const [offBlockTime, setOffBlockTime] = useState('')
  const [onBlockTime, setOnBlockTime] = useState('')

  // NIGHT and IMC as hh:mm (hours + minutes)
  const [nightHours, setNightHours] = useState<number | ''>('')
  const [nightMinutes, setNightMinutes] = useState<number | ''>('')
  const [imcHours, setImcHours] = useState<number | ''>('')
  const [imcMinutes, setImcMinutes] = useState<number | ''>('')

  const blockMinutes = useMemo(() => {
    if (flightTimeMode === 'total') {
      return toMinutes(toNum(totalBlockHours), toNum(totalBlockMinutes))
    }
    const offM = parseHHMM(offBlockTime || '0:00')
    const onM = parseHHMM(onBlockTime || '0:00')
    return blockFromOffOn(offM, onM)
  }, [flightTimeMode, totalBlockHours, totalBlockMinutes, offBlockTime, onBlockTime])

  const nightTotalMinutes = useMemo(
    () => toMinutes(toNum(nightHours), toNum(nightMinutes)),
    [nightHours, nightMinutes]
  )
  const imcTotalMinutes = useMemo(
    () => toMinutes(toNum(imcHours), toNum(imcMinutes)),
    [imcHours, imcMinutes]
  )

  const hasInput =
    blockMinutes > 0 || nightTotalMinutes > 0 || imcTotalMinutes > 0

  const portal: PortalTable | null = hasInput
    ? crewCompositionToPortalTable({
        blockMinutes,
        nightMinutes: nightTotalMinutes,
        imcMinutes: imcTotalMinutes,
        compositionType,
      })
    : null

  return (
    <main className="flex-1 p-4 pb-8 max-w-md mx-auto w-full">
      {/* Recording method */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Recording method
          </h2>
        </div>
        <div className="p-4 space-y-3">
          {COMPOSITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCompositionType(opt.value)}
              className={`w-full h-12 px-4 rounded-xl text-left font-medium transition active:scale-[0.98] ${
                compositionType === opt.value
                  ? 'bg-ios-blue text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      {/* Flight time: total or off/on block */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Block (flight time)
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFlightTimeMode('total')}
              className={`flex-1 h-11 rounded-xl font-medium transition ${
                flightTimeMode === 'total'
                  ? 'bg-ios-blue text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Total
            </button>
            <button
              type="button"
              onClick={() => setFlightTimeMode('block')}
              className={`flex-1 h-11 rounded-xl font-medium transition ${
                flightTimeMode === 'block'
                  ? 'bg-ios-blue text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Off & On
            </button>
          </div>

          {flightTimeMode === 'total' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="block-h" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Hours</label>
                <input
                  id="block-h"
                  type="number"
                  min={0}
                  max={24}
                  placeholder="0"
                  value={totalBlockHours === '' ? '' : totalBlockHours}
                  onChange={(e) =>
                    setTotalBlockHours(e.target.value === '' ? '' : Math.max(0, Math.min(24, Number(e.target.value))))
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <label htmlFor="block-m" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Minutes</label>
                <input
                  id="block-m"
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  value={totalBlockMinutes === '' ? '' : totalBlockMinutes}
                  onChange={(e) =>
                    setTotalBlockMinutes(e.target.value === '' ? '' : Math.max(0, Math.min(59, Number(e.target.value))))
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Times in UTC. Enter as hh:mm (24h).</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="off-block" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">Off block (UTC)</label>
                  <input
                    id="off-block"
                    type="text"
                    placeholder="hh:mm"
                    value={offBlockTime}
                    onChange={(e) => setOffBlockTime(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base placeholder:text-neutral-400"
                  />
                </div>
                <div>
                  <label htmlFor="on-block" className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-1">On block (UTC)</label>
                  <input
                    id="on-block"
                    type="text"
                    placeholder="hh:mm"
                    value={onBlockTime}
                    onChange={(e) => setOnBlockTime(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </div>
          )}

          {(blockMinutes > 0 || flightTimeMode === 'total') && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Total flight time: <span className="font-semibold tabular-nums">{formatMinutesAsHHMM(blockMinutes)}</span>
            </p>
          )}
        </div>
      </section>

      {/* NIGHT & IMC */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            NIGHT & IMC (hh:mm)
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Total NIGHT</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min={0}
                  max={24}
                  placeholder="0"
                  value={nightHours === '' ? '' : nightHours}
                  onChange={(e) =>
                    setNightHours(e.target.value === '' ? '' : Math.max(0, Math.min(24, Number(e.target.value))))
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Hours</span>
              </div>
              <div>
                <input
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  value={nightMinutes === '' ? '' : nightMinutes}
                  onChange={(e) =>
                    setNightMinutes(e.target.value === '' ? '' : Math.max(0, Math.min(59, Number(e.target.value))))
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Minutes</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">Total IMC</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  min={0}
                  max={24}
                  placeholder="0"
                  value={imcHours === '' ? '' : imcHours}
                  onChange={(e) =>
                    setImcHours(e.target.value === '' ? '' : Math.max(0, Math.min(24, Number(e.target.value))))
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Hours</span>
              </div>
              <div>
                <input
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  value={imcMinutes === '' ? '' : imcMinutes}
                  onChange={(e) =>
                    setImcMinutes(e.target.value === '' ? '' : Math.max(0, Math.min(59, Number(e.target.value))))
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company portal table (A5:F9 style) */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Company portal entry (hh:mm)
          </h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {portal ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700">
                  <th className="py-2 pr-3 font-medium text-neutral-500 dark:text-neutral-400"></th>
                  <th colSpan={2} className="py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">DUTY</th>
                  <th colSpan={2} className="py-2 px-2 font-medium text-neutral-500 dark:text-neutral-400">OTHER DUTY</th>
                  <th className="py-2 pl-2 font-medium text-neutral-500 dark:text-neutral-400">IMC</th>
                </tr>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs">
                  <th className="py-1.5 pr-3"></th>
                  <th className="py-1.5 px-2">OPR</th>
                  <th className="py-1.5 px-2">NIGHT</th>
                  <th className="py-1.5 px-2">OPR</th>
                  <th className="py-1.5 px-2">NIGHT</th>
                  <th className="py-1.5 pl-2"></th>
                </tr>
              </thead>
              <tbody>
                {portal.rows.map((row) => (
                  <tr key={row.role} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2.5 pr-3 font-medium text-neutral-700 dark:text-neutral-200">{row.role}</td>
                    <td className={`py-2.5 px-2 tabular-nums ${row.dutyOpr ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800'}`}>
                      {row.dutyOpr ?? '—'}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums ${row.dutyNight ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800'}`}>
                      {row.dutyNight ?? '—'}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums ${row.otherOpr ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800'}`}>
                      {row.otherOpr ?? '—'}
                    </td>
                    <td className={`py-2.5 px-2 tabular-nums ${row.otherNight ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800'}`}>
                      {row.otherNight ?? '—'}
                    </td>
                    <td className="py-2.5 pl-2 tabular-nums text-neutral-900 dark:text-white">{row.imc ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-neutral-500 dark:text-neutral-400 text-sm py-4">
              Enter block time and/or NIGHT & IMC above to see portal values.
            </p>
          )}
        </div>
      </section>

      {/* Divisible by 3 reference */}
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Divisible by 3 (minutes)
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            Handy reference for splitting flight time across 3 crew.
          </p>
          <table className="w-full text-center border-collapse text-sm">
            <tbody>
              {DIVISIBLE_BY_3_MINUTES.map((row, i) => (
                <tr key={i}>
                  {row.map((n) => (
                    <td key={n} className="py-1.5 px-2 tabular-nums text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded">
                      {n}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

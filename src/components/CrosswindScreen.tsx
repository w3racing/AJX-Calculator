import { useState, useMemo } from 'react'
import { crosswindHeadwind } from '../lib/crosswindCalculator'

function toNum(v: string): number {
  const n = parseFloat(v.trim())
  return Number.isNaN(n) ? 0 : n
}

function formatKt(n: number): string {
  const a = Math.abs(n)
  if (a < 0.1) return '0'
  if (a >= 100) return n.toFixed(0)
  if (a >= 1) return n.toFixed(1).replace(/\.0$/, '')
  return n.toFixed(1)
}

export function CrosswindScreen() {
  const [runwayInput, setRunwayInput] = useState('')
  const [windDirInput, setWindDirInput] = useState('')
  const [windSpeedInput, setWindSpeedInput] = useState('')

  const runwayDeg = useMemo(() => {
    const v = toNum(runwayInput)
    if (runwayInput.trim() === '') return null
    const h = Math.round(v) % 360
    return h < 0 ? h + 360 : h
  }, [runwayInput])

  // International standard: wind direction = direction wind is blowing FROM
  const windFromDeg = useMemo(() => {
    const v = toNum(windDirInput)
    if (windDirInput.trim() === '') return null
    const h = Math.round(v) % 360
    return h < 0 ? h + 360 : h
  }, [windDirInput])

  const windSpeedKt = useMemo(() => {
    const v = toNum(windSpeedInput)
    return windSpeedInput.trim() === '' ? 0 : Math.max(0, v)
  }, [windSpeedInput])

  const result = useMemo(() => {
    if (runwayDeg == null || windFromDeg == null) return null
    return crosswindHeadwind(runwayDeg, windFromDeg, windSpeedKt)
  }, [runwayDeg, windFromDeg, windSpeedKt])

  return (
    <main className="flex-1 p-4 pb-8 max-w-md mx-auto w-full space-y-6">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Runway & wind
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Runway heading (°)
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={360}
              value={runwayInput}
              onChange={(e) => setRunwayInput(e.target.value)}
              placeholder="e.g. 90"
              className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-transparent dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Wind direction (°) — from which wind blows
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={360}
              value={windDirInput}
              onChange={(e) => setWindDirInput(e.target.value)}
              placeholder="e.g. 90"
              className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-transparent dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
              Wind speed (kt)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={windSpeedInput}
              onChange={(e) => setWindSpeedInput(e.target.value)}
              placeholder="0"
              className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-transparent dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-ios-blue"
            />
          </div>
        </div>
      </section>

      {result != null && (
        <>
          <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
              <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Components
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">Crosswind</span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {formatKt(Math.abs(result.crosswindKt))} kt {result.crosswindKt >= 0 ? 'from left' : 'from right'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-300">
                  {result.headwindKt >= 0 ? 'Headwind' : 'Tailwind'}
                </span>
                <span className="font-medium text-neutral-900 dark:text-white">
                  {formatKt(Math.abs(result.headwindKt))} kt
                </span>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

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

/** Diagram: runway horizontal, wind arrow, crosswind + headwind components. Angles in degrees, runway = 0 is up in diagram (nose up). */
function CrosswindDiagram({
  runwayHeadingDeg,
  windDirectionDeg,
  windSpeedKt,
  crosswindKt,
  headwindKt,
}: {
  runwayHeadingDeg: number
  windDirectionDeg: number
  windSpeedKt: number
  crosswindKt: number
  headwindKt: number
}) {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const runwayLen = 70
  // Runway on screen: runway 090 = east = right. So runway angle from north = runwayHeadingDeg; "up" in math is 0°, so runway drawn at (90 - runwayHeadingDeg) so that 90° points right.
  const runwayAngleRad = ((90 - runwayHeadingDeg) * Math.PI) / 180
  const rx = Math.cos(runwayAngleRad) * runwayLen
  const ry = -Math.sin(runwayAngleRad) * runwayLen

  // Wind FROM direction: met convention. Wind 270 = from west = arrow pointing east (to 90). So arrow direction = windDirectionDeg + 180 (blowing toward).
  const windBlowTowardDeg = (windDirectionDeg + 180) % 360
  const windAngleRad = ((90 - windBlowTowardDeg) * Math.PI) / 180
  const windScale = Math.min(1, windSpeedKt / 30) * 50
  const wx = Math.cos(windAngleRad) * windScale
  const wy = -Math.sin(windAngleRad) * windScale

  // Crosswind: perpendicular to runway. Positive crosswind = from left of runway = arrow pointing right of runway direction.
  const perpAngleRad = runwayAngleRad + Math.PI / 2
  const cwScale = Math.min(1, Math.abs(crosswindKt) / 25) * 45
  const cwx = Math.cos(perpAngleRad) * (crosswindKt >= 0 ? 1 : -1) * cwScale
  const cwy = -Math.sin(perpAngleRad) * (crosswindKt >= 0 ? 1 : -1) * cwScale

  // Headwind: along runway. Positive = headwind = against us = arrow from nose backward.
  const hwScale = Math.min(1, Math.abs(headwindKt) / 25) * 45
  const hwx = (headwindKt >= 0 ? -1 : 1) * Math.cos(runwayAngleRad) * hwScale
  const hwy = (headwindKt >= 0 ? 1 : -1) * Math.sin(runwayAngleRad) * hwScale

  const stroke = 'currentColor'
  const strokeWidth = 2
  const arrowSize = 6

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-[240px] mx-auto text-neutral-500 dark:text-neutral-400"
      aria-hidden
    >
      <g transform={`translate(${cx},${cy})`}>
        {/* Runway centre line */}
        <line
          x1={-rx}
          y1={-ry}
          x2={rx}
          y2={ry}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray="6 4"
          opacity={0.6}
        />
        {/* Runway label */}
        <text x={rx + 12} y={-ry} textAnchor="start" fontSize={10} fill="currentColor" opacity={0.8}>
          Rwy
        </text>
        {/* Wind arrow (from wind source toward blow direction) */}
        {windSpeedKt > 0 && (
          <g stroke="#0ea5e9" strokeWidth={2.5} fill="none">
            <line x1={0} y1={0} x2={wx} y2={wy} />
            <line
              x1={wx}
              y1={wy}
              x2={wx - Math.cos(windAngleRad) * arrowSize - Math.cos(windAngleRad + 0.4) * 4}
              y2={wy + Math.sin(windAngleRad) * arrowSize + Math.sin(windAngleRad + 0.4) * 4}
            />
            <line
              x1={wx}
              y1={wy}
              x2={wx - Math.cos(windAngleRad) * arrowSize - Math.cos(windAngleRad - 0.4) * 4}
              y2={wy + Math.sin(windAngleRad) * arrowSize + Math.sin(windAngleRad - 0.4) * 4}
            />
          </g>
        )}
        {/* Crosswind component */}
        {Math.abs(crosswindKt) >= 0.5 && (
          <g stroke="#f59e0b" strokeWidth={2} fill="none" opacity={0.9}>
            <line x1={0} y1={0} x2={cwx} y2={cwy} strokeDasharray="4 3" />
            <line
              x1={cwx}
              y1={cwy}
              x2={cwx - Math.cos(perpAngleRad) * (crosswindKt >= 0 ? 1 : -1) * arrowSize - Math.cos(perpAngleRad + 0.5) * 4}
              y2={cwy + Math.sin(perpAngleRad) * (crosswindKt >= 0 ? 1 : -1) * arrowSize + Math.sin(perpAngleRad + 0.5) * 4}
            />
            <line
              x1={cwx}
              y1={cwy}
              x2={cwx - Math.cos(perpAngleRad) * (crosswindKt >= 0 ? 1 : -1) * arrowSize - Math.cos(perpAngleRad - 0.5) * 4}
              y2={cwy + Math.sin(perpAngleRad) * (crosswindKt >= 0 ? 1 : -1) * arrowSize + Math.sin(perpAngleRad - 0.5) * 4}
            />
          </g>
        )}
        {/* Headwind/tailwind component */}
        {Math.abs(headwindKt) >= 0.5 && (
          <g stroke="#22c55e" strokeWidth={2} fill="none" opacity={0.9}>
            <line x1={0} y1={0} x2={hwx} y2={hwy} strokeDasharray="3 4" />
            <line
              x1={hwx}
              y1={hwy}
              x2={hwx + Math.cos(runwayAngleRad) * (headwindKt >= 0 ? 1 : -1) * arrowSize + Math.cos(runwayAngleRad + 0.5) * 4}
              y2={hwy - Math.sin(runwayAngleRad) * (headwindKt >= 0 ? 1 : -1) * arrowSize - Math.sin(runwayAngleRad + 0.5) * 4}
            />
            <line
              x1={hwx}
              y1={hwy}
              x2={hwx + Math.cos(runwayAngleRad) * (headwindKt >= 0 ? 1 : -1) * arrowSize + Math.cos(runwayAngleRad - 0.5) * 4}
              y2={hwy - Math.sin(runwayAngleRad) * (headwindKt >= 0 ? 1 : -1) * arrowSize - Math.sin(runwayAngleRad - 0.5) * 4}
            />
          </g>
        )}
      </g>
    </svg>
  )
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

  // Pilot convention: wind direction = direction wind is blowing TO
  const windDirDeg = useMemo(() => {
    const v = toNum(windDirInput)
    if (windDirInput.trim() === '') return null
    const h = Math.round(v) % 360
    return h < 0 ? h + 360 : h
  }, [windDirInput])

  const windFromDeg = useMemo(() => {
    if (windDirDeg == null) return null
    return (windDirDeg + 180) % 360
  }, [windDirDeg])

  const windSpeedKt = useMemo(() => {
    const v = toNum(windSpeedInput)
    return windSpeedInput.trim() === '' ? 0 : Math.max(0, v)
  }, [windSpeedInput])

  const result = useMemo(() => {
    if (runwayDeg == null || windFromDeg == null) return null
    return crosswindHeadwind(runwayDeg, windFromDeg, windSpeedKt)
  }, [runwayDeg, windFromDeg, windSpeedKt])

  const hasDiagram = runwayDeg != null && windFromDeg != null && windSpeedKt > 0

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
              Wind direction (°)
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

          {hasDiagram && (
            <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
                <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Diagram
                </h2>
              </div>
              <div className="p-4 pt-2">
                <CrosswindDiagram
                  runwayHeadingDeg={runwayDeg ?? 0}
                  windDirectionDeg={windFromDeg ?? 0}
                  windSpeedKt={windSpeedKt}
                  crosswindKt={result.crosswindKt}
                  headwindKt={result.headwindKt}
                />
                <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 border-t-2 border-dashed border-current opacity-60" /> Runway
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 bg-[#0ea5e9]" /> Wind
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-[#f59e0b]" /> Crosswind
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-[#22c55e]" /> Head/Tail
                  </span>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

import { useState, useMemo } from 'react'
import { calculateWheelsUp } from '../lib/wheelsUpCalculator'

function pad2(n: number): string {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0')
}

export function WheelsUpScreen() {
  const [targetHour, setTargetHour] = useState(22)
  const [targetMinute, setTargetMinute] = useState(0)
  const [flightHours, setFlightHours] = useState<number | ''>(1)
  const [flightMinutes, setFlightMinutes] = useState<number | ''>(30)

  const targetTimeUtc = `${pad2(targetHour)}:${pad2(targetMinute)}`

  const result = useMemo(() => {
    const h = typeof flightHours === 'number' ? flightHours : 0
    const m = typeof flightMinutes === 'number' ? flightMinutes : 0
    return calculateWheelsUp({
      targetTimeUtc,
      flightTimeHours: h,
      flightTimeMinutes: m,
    })
  }, [targetTimeUtc, flightHours, flightMinutes])

  return (
    <main className="flex-1 p-4 pb-8 max-w-md mx-auto w-full space-y-6">
      <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
          <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            Inputs
          </h2>
        </div>
        <div className="p-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Airport opening or closing time (UTC)
            </label>
            <div className="flex gap-2 items-center">
              <label htmlFor="target-h" className="sr-only">
                Hour
              </label>
              <input
                id="target-h"
                type="number"
                min={0}
                max={23}
                value={targetHour}
                onChange={(e) =>
                  setTargetHour(Math.max(0, Math.min(23, Number(e.target.value) || 0)))
                }
                className="flex-1 h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-neutral-500 dark:text-neutral-400 shrink-0">:</span>
              <label htmlFor="target-m" className="sr-only">
                Minute
              </label>
              <input
                id="target-m"
                type="number"
                min={0}
                max={59}
                value={targetMinute}
                onChange={(e) =>
                  setTargetMinute(Math.max(0, Math.min(59, Number(e.target.value) || 0)))
                }
                className="flex-1 h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Hour (00–23) : Minute (00–59)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-300 mb-2">
              Planned flight time
            </label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Block time (wheels up to landing)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="flight-h" className="sr-only">
                  Hours
                </label>
                <input
                  id="flight-h"
                  type="number"
                  min={0}
                  max={24}
                  placeholder="0"
                  value={flightHours === '' ? '' : flightHours}
                  onChange={(e) =>
                    setFlightHours(
                      e.target.value === '' ? '' : Math.max(0, Math.min(24, Number(e.target.value)))
                    )
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">
                  Hours
                </span>
              </div>
              <div>
                <label htmlFor="flight-m" className="sr-only">
                  Minutes
                </label>
                <input
                  id="flight-m"
                  type="number"
                  min={0}
                  max={59}
                  placeholder="0"
                  value={flightMinutes === '' ? '' : flightMinutes}
                  onChange={(e) =>
                    setFlightMinutes(
                      e.target.value === ''
                        ? ''
                        : Math.max(0, Math.min(59, Number(e.target.value)))
                    )
                  }
                  className="w-full h-12 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-0 text-base text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-ios-blue focus:ring-offset-2 dark:focus:ring-offset-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 block">
                  Minutes
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {result && (
        <section className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm dark:shadow-none border border-neutral-200/60 dark:border-neutral-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200/60 dark:border-neutral-800">
            <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Result
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
              Wheels up time (UTC)
            </p>
            <p className="text-3xl font-semibold text-ios-green dark:text-ios-green tabular-nums">
              {result.wheelsUpTimeUtc}
              {result.previousDay && (
                <span className="text-base font-normal text-neutral-500 dark:text-neutral-400 ml-2">
                  (previous day)
                </span>
              )}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
              Depart at this time (UTC) to arrive at the curfew time. Taxi-in and
              sign-off time are not included.
            </p>
          </div>
        </section>
      )}

      <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
        For planning only. Confirm with company scheduling.
      </p>
    </main>
  )
}

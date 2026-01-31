import { useState, useEffect } from 'react'
import { HomeScreen } from './components/HomeScreen'
import { FDPScreen } from './components/FDPScreen'
import { CrewCompositionScreen } from './components/CrewCompositionScreen'
import { CrosswindScreen } from './components/CrosswindScreen'
import { WheelsUpScreen } from './components/WheelsUpScreen'

type Screen = 'home' | 'fdp' | 'crew' | 'curfew' | 'crosswind'

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  const title =
    screen === 'home'
      ? 'AJX Calculator'
      : screen === 'fdp'
        ? 'FDP Calculator'
        : screen === 'crew'
          ? '3 Crew Composition'
          : screen === 'curfew'
            ? 'Curfew Calculator'
            : 'Crosswind'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center gap-3 px-4 py-3 safe-area-top bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200/60 dark:border-neutral-800">
        {screen !== 'home' && (
          <button
            type="button"
            onClick={() => setScreen('home')}
            className="p-2 -ml-1 rounded-full active:scale-95 transition text-neutral-600 dark:text-neutral-300"
            aria-label="Back to home"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="flex-1 text-lg font-semibold text-neutral-800 dark:text-neutral-100">{title}</h1>
        <button
          type="button"
          onClick={() => setDarkMode((d) => !d)}
          className="p-2 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 active:scale-95 transition"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {screen === 'home' && (
        <HomeScreen
          onOpenFDP={() => setScreen('fdp')}
          onOpenCrewComposition={() => setScreen('crew')}
          onOpenCurfew={() => setScreen('curfew')}
          onOpenCrosswind={() => setScreen('crosswind')}
        />
      )}
      {screen === 'fdp' && (
        <main className="flex-1 p-4 pb-8 max-w-md mx-auto w-full">
          <FDPScreen />
        </main>
      )}
      {screen === 'crew' && <CrewCompositionScreen />}
      {screen === 'curfew' && <WheelsUpScreen />}
      {screen === 'crosswind' && <CrosswindScreen />}
    </div>
  )
}

export default App

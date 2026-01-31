interface HomeScreenProps {
  onOpenFDP: () => void
  onOpenCrewComposition: () => void
  onOpenCurfew: () => void
  onOpenCrosswind: () => void
}

export function HomeScreen({ onOpenFDP, onOpenCrewComposition, onOpenCurfew, onOpenCrosswind }: HomeScreenProps) {
  return (
    <main className="flex-1 p-4 pb-8 max-w-md mx-auto w-full">
      <div className="space-y-4">
        <button
          type="button"
          onClick={onOpenFDP}
          className="w-full p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-left shadow-sm dark:shadow-none active:scale-[0.99] transition"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">FDP Calculator</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Flight duty period limits, latest wheels-up, report time
          </p>
        </button>
        <button
          type="button"
          onClick={onOpenCrewComposition}
          className="w-full p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-left shadow-sm dark:shadow-none active:scale-[0.99] transition"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">3 Crew Composition</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Convert NIGHT & IMC to company portal entry format
          </p>
        </button>
        <button
          type="button"
          onClick={onOpenCurfew}
          className="w-full p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-left shadow-sm dark:shadow-none active:scale-[0.99] transition"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Curfew Calculator</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Departure time to arrive before airport closes or after it opens
          </p>
        </button>
        <button
          type="button"
          onClick={onOpenCrosswind}
          className="w-full p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 text-left shadow-sm dark:shadow-none active:scale-[0.99] transition"
        >
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Crosswind Calculator</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Crosswind and headwind from runway heading and wind
          </p>
        </button>
      </div>
      <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-8">
        AJX Flight Operations · For planning only
      </p>
    </main>
  )
}

const PHASES = ['orient', 'reflect', 'connect', 'act'] as const

type Phase = typeof PHASES[number]

interface PhaseBarProps {
  currentPhase: Phase
  completedPhases: Phase[]
}

export default function PhaseBar({ currentPhase, completedPhases }: PhaseBarProps) {
  return (
    <div className="flex gap-1">
      {PHASES.map((phase) => {
        const completed = completedPhases.includes(phase)
        const active = phase === currentPhase && !completed
        return (
          <div
            key={phase}
            className={`h-1 flex-1 rounded-full transition-colors ${
              completed || active ? 'bg-cayenne' : 'bg-border'
            }`}
          />
        )
      })}
    </div>
  )
}

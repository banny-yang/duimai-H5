import { PRE_PROMPTS, RACE_PROMPTS, POST_PROMPTS } from '@/constants/chat-prompts.js'

export function parseEventDate(iso) {
  if (!iso?.trim()) return null
  const d = new Date(`${iso.trim()}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function resolveH5Phase({ eventDate, eventStatus, apiPhase, phaseOverride }) {
  if (phaseOverride) return phaseOverride
  if (eventStatus === 'finished') return 'post'
  const raceDay = parseEventDate(eventDate)
  if (raceDay) {
    const today = startOfLocalDay(new Date())
    const race = startOfLocalDay(raceDay)
    if (today.getTime() < race.getTime()) return 'pre'
    if (today.getTime() === race.getTime()) return 'race'
    return 'post'
  }
  if (apiPhase === 'race') return 'race'
  if (apiPhase === 'post') return 'post'
  return 'pre'
}

export function readPhaseOverride(queryPhase) {
  const p = (queryPhase ?? '').trim()
  if (p === 'race' || p === 'pre' || p === 'post') return p
  return undefined
}

export function resolveQuickPrompts(phase, fromApi) {
  const pick = (custom, fallback) => {
    const list = custom?.filter(Boolean) ?? []
    return list.length > 0 ? list : fallback
  }
  if (phase === 'post') return pick(fromApi?.post, POST_PROMPTS)
  if (phase === 'race') return pick(fromApi?.race, RACE_PROMPTS)
  return pick(fromApi?.pre, PRE_PROMPTS)
}

export function phaseLabel(phase) {
  if (phase === 'race') return '赛中'
  if (phase === 'post') return '赛后'
  return '赛前'
}

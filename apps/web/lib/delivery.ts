/**
 * Next-day delivery date from Site settings → Delivery: orders after the cutoff (Las Vegas time)
 * move a day, then days without delivery and closed dates are skipped. Shared by cart and checkout.
 */
export type DeliverySettings = {
  cutoffTime?: string | null
  noDeliveryDays?: string[] | null
  holidays?: string[] | null
}

const TZ = 'America/Los_Angeles'
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/** Calendar parts of `date` in Las Vegas. */
function vegasParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  )
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
    time: `${parts.hour}:${parts.minute}`
  }
}

/** Returns the delivery date as YYYY-MM-DD (a Las Vegas calendar day). */
export function nextDeliveryDate(
  settings: DeliverySettings | null | undefined,
  now = new Date()
): string {
  const { y, m, d, time } = vegasParts(now)
  // work on a UTC-noon date so adding days never trips over DST
  const day = new Date(Date.UTC(y, m - 1, d, 12))
  const afterCutoff = !!settings?.cutoffTime && time >= settings.cutoffTime
  day.setUTCDate(day.getUTCDate() + (afterCutoff ? 2 : 1))
  const closedDays = new Set((settings?.noDeliveryDays ?? []).map((x) => x.toLowerCase()))
  const holidays = new Set(settings?.holidays ?? [])
  for (let i = 0; i < 14; i++) {
    const iso = day.toISOString().slice(0, 10)
    if (!closedDays.has(WEEKDAYS[day.getUTCDay()]!) && !holidays.has(iso)) return iso
    day.setUTCDate(day.getUTCDate() + 1)
  }
  return day.toISOString().slice(0, 10)
}

/** "Tuesday, Oct 7" */
export function formatDeliveryDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(y!, m! - 1, d!, 12)))
}

/** Time slots for a delivery request, e.g. 08:00–18:00 every 30 min. */
export function timeSlots(start = '08:00', end = '18:00', step = 30) {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const out: string[] = []
  for (let t = toMin(start); t <= toMin(end); t += Math.max(5, step)) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }
  return out
}

export const formatSlot = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return `${((h! + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h! < 12 ? 'AM' : 'PM'}`
}

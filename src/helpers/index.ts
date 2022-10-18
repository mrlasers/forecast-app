import { Predicate } from 'fp-ts/lib/Predicate'

export function kelvinToC(k: number): number {
  return k - 273
}

export function kelvinToF(k: number): number {
  return (9 / 5) * (k - 273) + 32
}

function englishDay(day: number) {
  switch (day) {
    default:
      return `Not a day? ${day}`
    case 1:
      return 'Monday'
    case 2:
      return 'Tuesday'
    case 3:
      return 'Wednesday'
    case 4:
      return 'Thursday'
    case 5:
      return 'Friday'
    case 6:
      return 'Saturday'
    case 7:
      return 'Sunday'
  }
}

function complement<A>(pred: Predicate<A>) {
  return (value: A) => !pred(value)
}

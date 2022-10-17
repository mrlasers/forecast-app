import './App.css'

import * as E from 'fp-ts/Either'
import * as Json from 'fp-ts/Json'
import { flow, pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/Option'
import * as TE from 'fp-ts/TaskEither'
import * as D from 'io-ts/Decoder'
import { useState } from 'react'

import { Coord, Forecast5, Geo } from './codecs'
import { MrError } from './types'

const appid = '4ecea15ea4a4f92aaa06f946ca0d3370'

function as<A>(input: any): A {
  return input as A
}

// fetch(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response>

const ftch = TE.tryCatchK(fetch, MrError.of('FETCH_ERROR'))
const getResJson = (res: Response) =>
  res.ok
    ? TE.tryCatch(() => res.json(), MrError.of('RESPONSE_ERROR'))
    : TE.left(
        MrError.of('RESPONSE_ERROR')(
          `Response not OK: (${res.status}) ${res.statusText}`
        )
      )
const ftchJson = flow(ftch, TE.chain(getResJson))

// const ftch = (input: RequestInfo | URL, init?: RequestInit) =>
//   pipe(
//     TE.tryCatch(
//       () => fetch(input, init),
//       (error) => ({ error })
//     ),
//     TE.chain(
//       TE.tryCatchK(
//         (res) => res.json(),
//         (error) => ({ error })
//       )
//     )
//     ,TE.chain(json => pipe(Json.parse(json)))
//   )

const zipApiUrl = (zipcode: string | number) => {
  return `http://api.openweathermap.org/geo/1.0/zip?zip=${zipcode}&appid=${appid}`
}

const forecastApiUrl = ({ lat, lon }: Coord) => {
  return `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${appid}`
}

function cacheForecast(forecast: any) {
  localStorage.setItem('cached-forecast', JSON.stringify(forecast))
  localStorage.setItem('last-cached-at', JSON.stringify(new Date().getTime()))
}

function getCachedForecast() {
  const lastCached = Number(localStorage.getItem('last-cached-at'))
  const now = new Date().getTime()
  const diff = now - lastCached
  const diffMinutes = diff / 1000 / 60

  return [lastCached, now, diff, diffMinutes]
}

function init() {
  const lastCached = Number(localStorage.getItem('last-cached-at') ?? 0)
  const forecast = localStorage.getItem('cached-forecast')
}

function fetchJson(url: string) {
  return fetch(url).then((res) => (res.ok ? res.json() : Promise.reject(res)))
}

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

export const fetchWeather = flow(
  zipApiUrl,
  ftchJson,
  TE.chainW(flow(Geo.decode, E.mapLeft(D.draw), TE.fromEither)),
  TE.bindTo('location'),
  TE.bind(
    'weather',
    flow(
      ({ location }) => forecastApiUrl(location),
      ftchJson,
      TE.chainW(flow(Forecast5.decode, E.mapLeft(D.draw), TE.fromEither))
    )
  )
)

function App() {
  const [forecast, setForecast] = useState<{}>({})

  return (
    <div className='App'>
      <div>{JSON.stringify(getCachedForecast())}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault()

          const zip = e.currentTarget['zip'].value

          console.log('getting response for zip:', zip)

          fetchWeather(zip)()
            .then(
              E.foldW(
                () => 'oops',
                ({ location, weather }) => {
                  const { timezone } = weather.city
                  return weather.list.map((item) => {
                    return {
                      temp: kelvinToF(item.main.temp),
                      min: item.main.temp_min,
                      max: item.main.temp_max,
                    }
                  })
                  // .map((item) => {
                  //   return new Date((item.dt - timezone) * 1000).getDay()
                  // })
                  // .map(englishDay)
                }
              )
            )
            .then((res) => JSON.stringify(res, null, 2))
            .then(console.log)
            .catch(console.error)
        }}
      >
        <input
          type='text'
          name='zip'
          defaultValue='98366'
          minLength={5}
          maxLength={5}
          data-lpignore='true'
          autoComplete='off'
          onKeyDown={(e) => {
            switch (e.key) {
              default:
                if (e.ctrlKey) return
                if (
                  !/[0-9]/.test(e.key) ||
                  e.currentTarget.maxLength - e.currentTarget.value.length < 1
                ) {
                  return e.preventDefault()
                }
              case 'Backspace':
              case 'Enter':
                return 'let these do defaults'
            }
          }}
        />
        <button type='submit'>Find Location</button>
      </form>
      <pre style={{ textAlign: 'left' }}>
        {JSON.stringify(forecast, null, 2)}
      </pre>
    </div>
  )
}

export default App

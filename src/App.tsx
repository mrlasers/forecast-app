import './App.css'

import * as E from 'fp-ts/Either'
import * as Json from 'fp-ts/Json'
import { flow, identity, pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/Option'
import * as T from 'fp-ts/Task'
import * as TE from 'fp-ts/TaskEither'
import * as D from 'io-ts/Decoder'
import { useState } from 'react'

import { Coord, Forecast5, Geo, WeatherCache } from './codecs'
import ForecastCard from './Forecast'
import { MrError } from './types'

const appid = '4ecea15ea4a4f92aaa06f946ca0d3370'

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

const zipApiUrl = (zipcode: string | number) => {
  return `http://api.openweathermap.org/geo/1.0/zip?zip=${zipcode}&appid=${appid}`
}

const forecastApiUrl = ({ lat, lon }: Coord) => {
  return `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${appid}`
}

export const fetchWeather = (zipcode: string | number) =>
  pipe(
    ftchJson(`${import.meta.env.VITE_API_URL}/api/weather/forecast/${zipcode}`),
    TE.chainW(flow(Forecast5.decode, TE.fromEither))
  )

export const _fetchWeather = flow(
  zipApiUrl,
  ftchJson,
  TE.chainW(flow(Geo.decode, E.mapLeft(D.draw), TE.fromEither)),
  TE.bindTo('location'),
  TE.bind(
    'forecast',
    flow(
      ({ location }) => forecastApiUrl(location),
      ftchJson,
      TE.chainW(flow(Forecast5.decode, E.mapLeft(D.draw), TE.fromEither))
    )
  ),
  TE.bind('fetched', () => TE.right(new Date().getTime()))
)

function impure_isMoreThanMinutesAgo(minutes: number, dt: number): boolean {
  return new Date().getTime() - dt > minutes * 60 * 1000
}

// : TE.TaskEither<MrError, {location: Geo; forecast: Forecast5}>
// export const fetchWeatherWithCache = (zip: string | number) => {
//   return pipe(
//     localStorage.getItem(`cache-${zip}`),
//     E.fromNullable(MrError.of('NO_CACHE')(zip)),
//     E.chainW(Json.parse),
//     E.chainW(WeatherCache.decode),
//     E.chainFirstW(
//       E.fromPredicate(
//         ({ fetched }) => !impure_isMoreThanMinutesAgo(60, fetched),
//         (_) => "literally don't care"
//       )
//     ),
//     E.fold(
//       (_) =>
//         pipe(
//           fetchWeather(zip),
//           TE.map((data) => {
//             // save to local storage, but maybe don't put it here?
//             localStorage.setItem(`cache-${zip}`, JSON.stringify(data))
//             return data
//           })
//         ),
//       TE.of
//     )
//   )
// }

function App() {
  const [state, setState] = useState<Forecast5 | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className='App'>
      <h1>
        {state ? state.city.name + ', ' + state.city.country : 'No data loaded'}
      </h1>
      <ForecastCard forecast={{ temp: 666, time: 'not now' }} />
      <form
        onSubmit={(e) => {
          e.preventDefault()

          fetchWeather(e.currentTarget['zip'].value)()
            .then(
              E.fold(
                () => {
                  setState(null)
                  setError(`Error getting forecast...`)
                },
                (data) => {
                  setState(data)
                  console.log(data)
                }
              )
            )
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
        {error ? <div style={{ color: 'red' }}>{error}</div> : null}
      </form>
      <pre style={{ textAlign: 'left' }}>{JSON.stringify(state, null, 2)}</pre>
    </div>
  )
}

export default App

import { pipe } from 'fp-ts/lib/function'
import * as D from 'io-ts/Decoder'

export const Coord = D.struct({
  lat: D.number,
  lon: D.number,
})

export type Coord = D.TypeOf<typeof Coord>

export const Geo = pipe(
  Coord,
  D.intersect(
    D.struct({
      zip: D.string,
      name: D.string,
      country: D.string,
    })
  )
)

export type Geo = D.TypeOf<typeof Geo>

export const City = D.struct({
  // id: D.string, // ?
  name: D.string,
  coord: Coord,
  country: D.string,
  population: D.number,
  timezone: D.number,
  sunrise: D.number, // Unix, UTC
  sunset: D.number, // Unix, UTC
})

export type City = D.TypeOf<typeof City>

export const Forecast5 = D.struct({
  cnt: D.number,
  list: D.array(
    D.struct({
      dt: D.number,
      main: D.struct({
        temp: D.number,
        feels_like: D.number,
        temp_min: D.number,
        temp_max: D.number,
        pressure: D.number,
        sea_level: D.number,
        grnd_level: D.number,
        humidity: D.number,
      }),
      weather: D.array(
        D.struct({
          id: D.number,
          main: D.string,
          description: D.string,
          icon: D.string,
        })
      ),
      clouds: D.struct({
        all: D.number,
      }),
      wind: D.struct({
        speed: D.number,
        deg: D.number,
        gust: D.number,
      }),
      visibility: D.number,
      pop: D.number, // probability of precipitation
      // rain: D.number, // rain volume in last 3 hours (mm)
      // snow: D.number, // snow volume in last 3 hours
      // sys: D.string, // part of the day (n - night, d -day)
      dt_txt: D.string, // time of data forecasted, ISO, UTC
    })
  ),
  city: City,
})

export type Forecast5 = D.TypeOf<typeof Forecast5>

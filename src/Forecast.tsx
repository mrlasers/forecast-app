import React, { useState } from 'react'

import styles from './ForecastCard.module.scss'

export type DailyForecast = {
  time: string
  temp: number
}

type Props = {
  forecast: DailyForecast
}

const ForecastCard: React.FC<Props> = ({ forecast, ...props }) => {
  return <div className={styles.forecastCard}>{forecast.time}</div>
}

export default ForecastCard

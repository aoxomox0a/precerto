import React, { useEffect, useState } from 'react'
import { getWeatherForecast } from '../../../src/services/api'

const weatherRequestCache = new Map()
const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not scheduled'
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const getWeatherIcon = (weatherCode, description = '') => {
  if (weatherCode === 95 || weatherCode === 96 || weatherCode === 99) return '⛈️'
  if ([61, 63, 65, 80, 81, 82, 51, 53, 55, 56, 57].includes(weatherCode)) return '🌧️'
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) return '❄️'
  if (weatherCode === 0 || weatherCode === 1) return '☀️'
  if (weatherCode === 2) return '⛅'
  if (weatherCode === 3) return '☁️'
  if (description.toLowerCase().includes('fog')) return '🌫️'
  return '🌤️'
}

const buildLocationParams = (patient) => {
  if (!patient) return null

  const resolvedCity =
    patient.city ||
    patient.homeCity ||
    patient.home_city ||
    patient.location ||
    patient.locationCity ||
    'Geneva'

  const resolvedLocationSource =
    patient.locationSource || patient.location_source || patient.source || 'profile'

  if (resolvedLocationSource === 'profile' && resolvedCity) {
    return {
      city: resolvedCity,
      label: resolvedCity,
    }
  }

  if (patient.latitude != null && patient.longitude != null) {
    return {
      latitude: patient.latitude,
      longitude: patient.longitude,
      label: resolvedCity || patient.name || 'Current location',
    }
  }

  if (resolvedCity) {
    return {
      city: resolvedCity,
      label: resolvedCity,
    }
  }

  return null
}

const getConsultationScheduledValue = (consultation) =>
  consultation?.scheduledFor || consultation?.scheduled_for || consultation?.scheduledAt || consultation?.scheduled_at || null

const isFutureConsultation = (consultation) => {
  if (!consultation || consultation.status === 'completed') return false
  const scheduledValue = getConsultationScheduledValue(consultation)
  const scheduledDate = new Date(scheduledValue)
  return !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now()
}

const normalizeWeatherPayload = (payload) => ({
  location: payload?.location || null,
  consultation_datetime: payload?.consultation_datetime || payload?.consultationDatetime || null,
  forecast_datetime: payload?.forecast_datetime || payload?.forecastDatetime || null,
  weather_code: payload?.weather_code ?? payload?.weatherCode ?? null,
  weather_description: payload?.weather_description || payload?.weatherDescription || 'Weather unavailable',
  temperature_c: payload?.temperature_c ?? payload?.temperatureC ?? null,
  apparent_temperature_c: payload?.apparent_temperature_c ?? payload?.apparentTemperatureC ?? null,
  precipitation_probability:
    payload?.precipitation_probability ?? payload?.precipitationProbability ?? null,
  wind_speed_kph: payload?.wind_speed_kph ?? payload?.windSpeedKph ?? null,
  uv_index: payload?.uv_index ?? payload?.uvIndex ?? null,
  recommendation: payload?.recommendation || 'Weather unavailable',
  source: payload?.source || null,
  updated_at: payload?.updated_at || payload?.updatedAt || null,
})

const getWeatherCacheKey = ({ consultationId, city, latitude, longitude, scheduledValue, revision = 0 }) =>
  [consultationId || 'unknown', city || '', latitude ?? '', longitude ?? '', scheduledValue || '', revision].join('|')

const getCacheAgeMs = (entry) => {
  if (!entry?.fetchedAt) return null
  return Date.now() - entry.fetchedAt
}

const isCacheFresh = (entry) => {
  const ageMs = getCacheAgeMs(entry)
  return ageMs != null && ageMs < WEATHER_CACHE_TTL_MS
}

const hasUsableWeatherFields = (payload) => {
  if (!payload || typeof payload !== 'object') return false
  return Boolean(
    payload.weather_code != null ||
    payload.temperature_c != null ||
    payload.recommendation ||
    payload.forecast_datetime
  )
}

const getForecastSummaryLabel = (payload) => {
  if (!payload) return 'Weather unavailable'
  const description = payload.weather_description && payload.weather_description !== 'Weather unavailable'
    ? payload.weather_description
    : ''
  const hasMeaningfulData = payload.temperature_c != null || payload.recommendation || payload.forecast_datetime

  if (description) return description
  if (hasMeaningfulData) return 'Forecast'
  return 'Weather unavailable'
}

const fetchWeatherOnce = async (cacheKey, params) => {
  const cached = weatherRequestCache.get(cacheKey)
  if (cached?.status === 'resolved' && isCacheFresh(cached)) {
    return { data: cached.data, source: 'cache', cacheAgeMs: getCacheAgeMs(cached) }
  }
  if (cached?.status === 'pending') return cached.promise

  if (cached?.status === 'resolved' && !isCacheFresh(cached)) {
    console.log('[ConsultationCardWeather] cache expired', {
      cacheKey,
      cacheAgeMs: getCacheAgeMs(cached),
      ttlMs: WEATHER_CACHE_TTL_MS,
    })
    weatherRequestCache.delete(cacheKey)
  }

  const promise = getWeatherForecast(params)
    .then((data) => {
      const entry = weatherRequestCache.get(cacheKey)
      if (entry) {
        entry.status = 'resolved'
        entry.data = data
        entry.promise = null
        entry.fetchedAt = Date.now()
        entry.source = 'backend'
      } else {
        weatherRequestCache.set(cacheKey, {
          status: 'resolved',
          data,
          promise: null,
          fetchedAt: Date.now(),
          source: 'backend',
        })
      }
      return { data, source: 'backend', cacheAgeMs: 0 }
    })
    .catch((error) => {
      weatherRequestCache.delete(cacheKey)
      throw error
    })

  weatherRequestCache.set(cacheKey, { status: 'pending', promise, data: null, fetchedAt: null, source: 'backend' })
  return promise
}

export const ConsultationCardWeather = ({ patient, consultation, consultationWeatherRevision = 0 }) => {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(() => isFutureConsultation(consultation))
  const [error, setError] = useState('')
  const [requestAttempted, setRequestAttempted] = useState(false)
  const [weatherSource, setWeatherSource] = useState('fallback')

  const scheduledValue = getConsultationScheduledValue(consultation)
  const scheduledDate = scheduledValue ? new Date(scheduledValue) : null
  const future = isFutureConsultation(consultation)
  const locationParams = buildLocationParams(patient)
  const resolvedCity = locationParams?.city || patient?.city || patient?.homeCity || patient?.home_city || patient?.location || 'Geneva'
  const weatherCacheKey = getWeatherCacheKey({
    consultationId: consultation?.id,
    city: locationParams?.city || null,
    latitude: locationParams?.latitude ?? null,
    longitude: locationParams?.longitude ?? null,
    scheduledValue,
    revision: consultationWeatherRevision,
  })
  const locationKey = patient?.latitude != null && patient?.longitude != null
    ? `coords:${patient.latitude}:${patient.longitude}:${patient.city || patient.name || ''}`
    : patient?.city
      ? `city:${patient.city}`
      : 'missing'

  console.log('ConsultationCardWeather mounted/rendered', consultation?.id)
  console.log('[ConsultationCardWeather] render', {
    consultationId: consultation?.id,
    scheduledValue,
    scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
    isFuture: future,
    resolvedCity,
    consultationWeatherRevision,
    weatherSource,
    patientLocation: {
      city: patient?.city || null,
      homeCity: patient?.homeCity || null,
      home_city: patient?.home_city || null,
      location: patient?.location || null,
      latitude: patient?.latitude ?? null,
      longitude: patient?.longitude ?? null,
    },
    hasLocation: Boolean(locationParams),
  })

  useEffect(() => {
    console.log('ConsultationCardWeather mounted', consultation?.id)
    return () => {
      console.log('ConsultationCardWeather unmounted', consultation?.id)
    }
  }, [consultation?.id])

  useEffect(() => {
    let active = true

    const loadWeather = async () => {
      console.log('[ConsultationCardWeather] useEffect', {
        consultationId: consultation?.id,
        scheduledValue,
        scheduledDate: scheduledDate ? scheduledDate.toISOString() : null,
        currentDate: new Date().toISOString(),
        isFuture: future,
        resolvedCity,
        consultationWeatherRevision,
        patientLocation: {
          city: patient?.city || null,
          latitude: patient?.latitude ?? null,
          longitude: patient?.longitude ?? null,
        },
        locationKey,
      })

      if (!isFutureConsultation(consultation)) {
        setWeather(null)
        setError('')
        setRequestAttempted(false)
        setWeatherSource('fallback')
        setLoading(false)
        return
      }

      const locationParams = buildLocationParams(patient)
      console.log('[ConsultationCardWeather] location check', {
        consultationId: consultation?.id,
        city: patient?.city || null,
        homeCity: patient?.homeCity || null,
        home_city: patient?.home_city || null,
        location: patient?.location || null,
        resolvedCity,
        latitude: patient?.latitude ?? null,
        longitude: patient?.longitude ?? null,
        locationParams,
      })

      if (!locationParams) {
        setWeather(null)
        setError('Location missing for weather')
        setRequestAttempted(false)
        setWeatherSource('fallback')
        setLoading(false)
        return
      }

      setRequestAttempted(true)
      setLoading(true)
      setError('')

      console.log('Triggering weather fetch')
      console.log('[ConsultationCardWeather] request', {
        patientId: patient?.id,
        consultationId: consultation?.id,
        cacheKey: weatherCacheKey,
        locationParams,
        targetDatetime: scheduledValue,
      })

      try {
        const result = await fetchWeatherOnce(weatherCacheKey, {
          ...locationParams,
          targetDatetime: scheduledValue,
        })

        if (!active) return
        console.log('[ConsultationCardWeather] response', result)
        console.log('[ConsultationCardWeather] source', {
          source: result.source,
          cacheKey: weatherCacheKey,
          cacheAgeMs: result.cacheAgeMs,
        })
        setWeather(normalizeWeatherPayload(result.data))
        setWeatherSource(result.source || 'backend')
      } catch (requestError) {
        if (active) {
          setWeather(null)
          console.log('[ConsultationCardWeather] error', requestError)
          console.log('[ConsultationCardWeather] source', {
            source: 'fallback',
            cacheKey: weatherCacheKey,
            reason: requestError?.message || 'request failed',
          })
          setWeatherSource('fallback')
          setError('Weather unavailable')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadWeather().catch(() => {})
    const refreshTimer = window.setInterval(() => {
      loadWeather().catch(() => {})
    }, 10 * 60 * 1000)

    return () => {
      active = false
      window.clearInterval(refreshTimer)
    }
  }, [consultation, consultationWeatherRevision, patient?.id, patient?.city, patient?.latitude, patient?.longitude, scheduledValue, future, locationKey])

  if (!future) return null

  const icon = getWeatherIcon(weather?.weather_code, weather?.weather_description || '')
  const temperatureLabel =
    weather?.temperature_c != null ? `${Math.round(weather.temperature_c)}°C` : 'Temperature unavailable'
  const conditionLabel = getForecastSummaryLabel(weather)
  const recommendationLabel = weather?.recommendation || 'Weather unavailable'
  const statusLabel = loading
    ? (requestAttempted ? 'Calling weather API...' : 'Loading weather...')
    : error
      ? error
      : weather?.forecast_datetime
        ? formatDateTime(weather.forecast_datetime)
        : requestAttempted
          ? hasUsableWeatherFields(weather)
            ? 'Forecast'
            : 'Weather unavailable'
          : 'Loading weather...'

    console.log('[ConsultationCardWeather] display', {
      consultationId: consultation?.id,
      cacheKey: weatherCacheKey,
      weatherSource,
      cacheAgeMs: getCacheAgeMs(weatherRequestCache.get(weatherCacheKey)),
      hasUsableWeatherFields: hasUsableWeatherFields(weather),
      conditionLabel,
      temperatureLabel,
      recommendationLabel,
    })

  return (
    <div className="consultation-card-weather" aria-label="Consultation weather" aria-live="polite">
      <div className="consultation-card-weather__top">
        <span className="consultation-card-weather__icon" aria-hidden="true">
          {loading || (!requestAttempted && !error && !weather) ? '…' : icon}
        </span>
        <div className="consultation-card-weather__summary">
          <strong>
            {loading
              ? 'Loading weather...'
              : error
                ? error
                : weather
                  ? conditionLabel
                  : 'Loading weather...'}
          </strong>
          <span>
            {statusLabel}
          </span>
        </div>
      </div>

      {!loading && !error && weather && hasUsableWeatherFields(weather) && (
        <>
          <p className="consultation-card-weather__details">
            {temperatureLabel}
          </p>
          <p className="consultation-card-weather__recommendation">{recommendationLabel}</p>
        </>
      )}

      {!loading && error && (
        <p className="consultation-card-weather__recommendation">{error}</p>
      )}
    </div>
  )
}

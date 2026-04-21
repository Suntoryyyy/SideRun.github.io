import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import Sparkline from '../components/Sparkline';
import EmptyState from '../components/EmptyState';
import { T, FONT } from '../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WeatherScreen({ navigation }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeatherData();
  }, []);

  const getWeatherData = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required for weather data.');
        setLoading(false);
        return;
      }
    } catch (permError) {
      console.log('Permission prompt failed', permError);
    }

    try {
      let userLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!userLocation) {
         userLocation = await Location.getLastKnownPositionAsync();
      }
      if (userLocation) {
        setLocation(userLocation.coords);
      }
    } catch (locationError) {
      console.log('Location fetch failed or timed out. Trying cached run coords.', locationError);
    }

    // If GPS permission was denied / unavailable on web, fall back to the
    // last run coordinates that useRunTracking caches after every run.
    if (!location) {
      try {
        const cached = await AsyncStorage.getItem('lastRunCoords');
        if (cached) {
          const { latitude, longitude } = JSON.parse(cached);
          if (latitude && longitude) setLocation({ latitude, longitude });
        }
      } catch (_) {}
    }
    
    try {
      // Mock weather data used only when no API key or no coords at all
      const mockWeather = {
        main: {
          temp: 22,
          humidity: 65,
          feels_like: 24,
        },
        weather: [{
          main: 'Clear',
          description: 'clear sky',
          icon: '01d',
        }],
        wind: {
          speed: 3.5,
        },
        sys: {
          sunrise: Date.now() - 3600000,
          sunset: Date.now() + 7200000,
        },
      };

      // Mock forecast (used only if no API key/location available)
      const mockForecast = [
        { time: '06:00', temp: 18, condition: 'Clear', icon: '01d' },
        { time: '09:00', temp: 22, condition: 'Sunny', icon: '02d' },
        { time: '12:00', temp: 25, condition: 'Sunny', icon: '01d' },
        { time: '15:00', temp: 24, condition: 'Partly cloudy', icon: '02d' },
        { time: '18:00', temp: 21, condition: 'Clear', icon: '01d' },
        { time: '21:00', temp: 19, condition: 'Clear', icon: '01n' },
      ];

      const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;
      // `location` is already populated from GPS or lastRunCoords above
      const coords = location;

      if (apiKey && coords) {
        try {
          const { data: current } = await axios.get(
            'https://api.openweathermap.org/data/2.5/weather',
            {
              params: {
                lat: coords.latitude,
                lon: coords.longitude,
                appid: apiKey,
                units: 'metric',
              },
            }
          );
          setWeather(current);

          const { data: forecastRes } = await axios.get(
            'https://api.openweathermap.org/data/2.5/forecast',
            {
              params: {
                lat: coords.latitude,
                lon: coords.longitude,
                appid: apiKey,
                units: 'metric',
                cnt: 6,
              },
            }
          );
          setForecast(
            (forecastRes?.list || []).map((slot) => ({
              time: new Date(slot.dt * 1000).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              temp: Math.round(slot.main?.temp),
              condition: slot.weather?.[0]?.main || 'Clear',
              icon: slot.weather?.[0]?.icon || '01d',
            }))
          );
        } catch (apiErr) {
          console.warn('OpenWeatherMap request failed, falling back to mock', apiErr);
          setWeather(mockWeather);
          setForecast(mockForecast);
        }
      } else {
        setWeather(mockWeather);
        setForecast(mockForecast);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error getting weather:', error);
      setLoading(false);
    }
  };

  const getWeatherIconName = (condition) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('thunder')) return 'thunderstorm';
    if (c.includes('snow')) return 'snow';
    if (c.includes('rain') || c.includes('drizzle')) return 'rainy';
    if (c.includes('cloud')) return 'partly-sunny';
    if (c.includes('clear') || c.includes('sun')) return 'sunny';
    if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return 'cloudy';
    return 'partly-sunny';
  };

  const getRunningChip = () => {
    if (!weather) return { label: 'Loading…', color: '#9AA0A6', bg: 'rgba(154,160,166,0.15)' };
    const t = weather.main.temp;
    const cond = weather.weather[0].main;
    const wind = weather.wind.speed;
    if (cond === 'Rain' || cond === 'Thunderstorm')
      return { label: 'Indoor is safer', color: '#E07A3A', bg: 'rgba(224,122,58,0.15)' };
    if (t < 5 || t > 30)
      return { label: 'Harsh conditions', color: '#E07A3A', bg: 'rgba(224,122,58,0.15)' };
    if (wind > 12)
      return { label: 'Windy — be cautious', color: '#E0A93A', bg: 'rgba(224,169,58,0.18)' };
    if (t >= 12 && t <= 24)
      return { label: 'Perfect for running', color: '#1EA574', bg: 'rgba(36,199,137,0.15)' };
    return { label: 'Good for a short run', color: '#1EA574', bg: 'rgba(36,199,137,0.15)' };
  };

  const getRunningRecommendation = () => {
    if (!weather) return 'Weather data not available';

    const temp = weather.main.temp;
    const condition = weather.weather[0].main;
    const windSpeed = weather.wind.speed;

    if (temp < 5) return 'Too cold for outdoor running. Consider indoor alternatives.';
    if (temp > 30) return 'Very hot! Run early morning or evening, stay hydrated.';
    if (condition === 'Rain') return 'Raining outside. Perfect time for indoor running or wait for better weather.';
    if (windSpeed > 15) return 'Very windy conditions. Be cautious of strong winds.';
    if (temp >= 15 && temp <= 25 && condition === 'Clear') return 'Perfect weather for running! 🌟';
    return 'Good conditions for a run. Check wind and humidity.';
  };

  const getBestRunTimes = () => {
    if (!forecast.length) return [];

    return forecast
      .filter(hour => {
        const temp = hour.temp;
        const condition = hour.condition;
        return temp >= 10 && temp <= 28 && !condition.includes('Rain') && !condition.includes('Thunder');
      })
      .slice(0, 3)
      .map(hour => `${hour.time} (${hour.temp}°C, ${hour.condition})`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading weather data...</Text>
      </View>
    );
  }

  if (!weather) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.title}>Weather & Running Guide</Text>
        </View>
        <EmptyState
          icon="cloud-offline-outline"
          title="Weather unavailable"
          desc="We couldn't reach a forecast. Check location permission and your connection, then try again."
          actionLabel="Try again"
          onAction={() => {
            setLoading(true);
            getWeatherData();
          }}
          accent="#E0A93A"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="arrow-back" size={28} color="#111111" />
          </TouchableOpacity>
          <Text style={styles.title}>Weather & Running Guide</Text>
          <Text style={styles.subtitle}>Smart recommendations for your runs</Text>
        </View>

        {weather && (() => {
          const chip = getRunningChip();
          const tempSeries = forecast.length > 0
            ? forecast.map((h) => h.temp)
            : [18, 22, 25, 24, 21, 19];
          const maxIdx = tempSeries.indexOf(Math.max(...tempSeries));
          const today = new Date();
          const dateStr = today
            .toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })
            .toUpperCase();
          return (
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>TODAY · {dateStr}</Text>
              <View style={styles.heroMainRow}>
                <View style={styles.heroLeft}>
                  <View style={styles.heroTempRow}>
                    <Text style={styles.heroTempNum}>
                      {Math.round(weather.main.temp)}
                    </Text>
                    <Text style={styles.heroTempUnit}>°</Text>
                  </View>
                  <Text style={styles.heroDesc}>
                    {weather.weather[0].description
                      .charAt(0)
                      .toUpperCase() + weather.weather[0].description.slice(1)}
                    {'  ·  Feels '}
                    {Math.round(weather.main.feels_like)}°
                  </Text>
                </View>
                <View style={styles.heroIconWrap}>
                  <Ionicons
                    name={getWeatherIconName(weather.weather[0].main)}
                    size={60}
                    color="#E0A93A"
                  />
                </View>
              </View>

              <View style={[styles.heroChip, { backgroundColor: chip.bg }]}>
                <View style={[styles.heroChipDot, { backgroundColor: chip.color }]} />
                <Text style={[styles.heroChipText, { color: chip.color }]}>
                  {chip.label}
                </Text>
              </View>

              <View style={styles.heroCurveWrap}>
                <Sparkline
                  data={tempSeries}
                  width={SCREEN_WIDTH - 40 - 32}
                  height={44}
                  color="#FF5A36"
                  fillOpacity={0.18}
                  highlightIndex={maxIdx}
                  strokeWidth={2.2}
                />
              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>HUMIDITY</Text>
                  <Text style={styles.heroStatValue}>{weather.main.humidity}%</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>WIND</Text>
                  <Text style={styles.heroStatValue}>
                    {weather.wind.speed.toFixed(1)}
                    <Text style={styles.heroStatUnit}> m/s</Text>
                  </Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatLabel}>AQI</Text>
                  <Text style={styles.heroStatValue}>45</Text>
                </View>
              </View>
            </View>
          );
        })()}

      <View style={styles.recommendationCard}>
        <Text style={styles.cardTitle}>Running Recommendation</Text>
        <Text style={styles.recommendationText}>{getRunningRecommendation()}</Text>
      </View>

      <View style={styles.bestTimesCard}>
        <Text style={styles.cardTitle}>Best Times to Run Today</Text>
        {getBestRunTimes().map((time, index) => (
          <Text key={index} style={styles.timeSlot}>• {time}</Text>
        ))}
        {getBestRunTimes().length === 0 && (
          <Text style={styles.noTimesText}>No optimal times found. Check tomorrow's forecast.</Text>
        )}
      </View>

      <View style={styles.hourlyForecastCard}>
        <Text style={styles.cardTitle}>Hourly Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
          {forecast.map((hour, index) => (
            <View key={index} style={styles.hourCard}>
              <Text style={styles.hourTime}>{hour.time}</Text>
              <Ionicons
                name={getWeatherIconName(hour.condition)}
                size={22}
                color="#E0A93A"
                style={styles.hourIconV2}
              />
              <Text style={styles.hourTemp}>{hour.temp}°</Text>
              <Text style={styles.hourCondition}>{hour.condition}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.cardTitle}>Weather Safety Tips</Text>
        <Text style={styles.tip}>• Stay hydrated, especially in hot weather</Text>
        <Text style={styles.tip}>• Wear appropriate clothing for the temperature</Text>
        <Text style={styles.tip}>• Check for UV index and use sunscreen</Text>
        <Text style={styles.tip}>• Be aware of changing weather conditions</Text>
        <Text style={styles.tip}>• Have a backup indoor plan for bad weather</Text>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={getWeatherData}>
        <Text style={styles.refreshButtonText}>Refresh Weather</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingBottom: 40,
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F5F7',
  },
  loadingText: {
    ...T.bodyMuted,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...T.title3,
    fontSize: 18,
    marginBottom: 6,
    marginTop: 4,
    maxWidth: '70%',
    textAlign: 'center',
  },
  subtitle: {
    ...T.bodyMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 28,
    shadowColor: '#0B0F13',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroLabel: {
    ...T.eyebrow,
    marginBottom: 8,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heroTempRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroTempNum: {
    ...T.displayXL,
  },
  heroTempUnit: {
    fontFamily: FONT.medium,
    fontSize: 32,
    color: '#6B6F76',
    marginLeft: 2,
  },
  heroDesc: {
    ...T.bodyMuted,
    marginTop: 2,
  },
  heroIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(224,169,58,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
  },
  heroChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  heroChipText: {
    ...T.pill,
  },
  heroCurveWrap: {
    marginTop: 12,
    marginBottom: 6,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  heroStat: {
    alignItems: 'flex-start',
  },
  heroStatLabel: {
    ...T.label,
    marginBottom: 2,
  },
  heroStatValue: {
    ...T.metricM,
    fontSize: 16,
  },
  heroStatUnit: {
    ...T.metricUnit,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    ...T.title4,
    marginBottom: 12,
  },
  recommendationText: {
    ...T.bodyL,
    color: '#444444',
    lineHeight: 24,
  },
  bestTimesCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  timeSlot: {
    ...T.bodyL,
    color: '#444444',
    marginBottom: 8,
    paddingLeft: 10,
  },
  noTimesText: {
    ...T.bodyMuted,
    fontSize: 15,
    fontStyle: 'italic',
    paddingLeft: 10,
  },
  hourlyForecastCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  forecastScroll: {
    marginTop: 10,
  },
  hourCard: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 80,
    backgroundColor: '#F4F5F7',
    padding: 15,
    borderRadius: 12,
  },
  hourTime: {
    ...T.caption,
    fontFamily: FONT.semibold,
    color: '#888888',
    marginBottom: 8,
  },
  hourIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  hourIconV2: {
    marginBottom: 8,
  },
  hourTemp: {
    ...T.metricM,
    marginBottom: 4,
  },
  hourCondition: {
    ...T.caption,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tip: {
    ...T.body,
    color: '#444444',
    marginBottom: 8,
    paddingLeft: 10,
  },
  refreshButton: {
    backgroundColor: '#24C789',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#24C789',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  refreshButtonText: {
    ...T.button,
    letterSpacing: 1,
  },
});

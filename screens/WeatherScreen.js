import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

export default function WeatherScreen() {
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
      console.log('Location fetch failed or timed out. Falling back to mock data.', locationError);
    }
    
    try {
      // For demo purposes, using mock weather data
      // In production, replace with: const API_KEY = 'your_openweathermap_key';
      // const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.coords.latitude}&lon=${userLocation.coords.longitude}&appid=${API_KEY}&units=metric`);

      // Mock weather data
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

      setWeather(mockWeather);

      // Mock forecast
      const mockForecast = [
        { time: '06:00', temp: 18, condition: 'Clear', icon: '01d' },
        { time: '09:00', temp: 22, condition: 'Sunny', icon: '02d' },
        { time: '12:00', temp: 25, condition: 'Sunny', icon: '01d' },
        { time: '15:00', temp: 24, condition: 'Partly cloudy', icon: '02d' },
        { time: '18:00', temp: 21, condition: 'Clear', icon: '01d' },
        { time: '21:00', temp: 19, condition: 'Clear', icon: '01n' },
      ];

      setForecast(mockForecast);
      setLoading(false);
    } catch (error) {
      console.error('Error getting weather:', error);
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    const icons = {
      'Clear': '☀️',
      'Sunny': '☀️',
      'Partly cloudy': '⛅',
      'Cloudy': '☁️',
      'Rain': '🌧️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
    };
    return icons[condition] || '☀️';
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather & Running Guide</Text>
        <Text style={styles.subtitle}>Smart recommendations for your runs</Text>
      </View>

      {weather && (
        <View style={styles.currentWeatherCard}>
          <View style={styles.weatherMain}>
            <Text style={styles.weatherIcon}>{getWeatherIcon(weather.weather[0].main)}</Text>
            <View style={styles.weatherInfo}>
              <Text style={styles.temperature}>{Math.round(weather.main.temp)}°C</Text>
              <Text style={styles.condition}>{weather.weather[0].description}</Text>
              <Text style={styles.feelsLike}>Feels like {Math.round(weather.main.feels_like)}°C</Text>
            </View>
          </View>
          <View style={styles.weatherDetails}>
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Humidity</Text>
              <Text style={styles.detailValue}>{weather.main.humidity}%</Text>
            </View>
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>Wind</Text>
              <Text style={styles.detailValue}>{weather.wind.speed} m/s</Text>
            </View>
            <View style={styles.detail}>
              <Text style={styles.detailLabel}>AQI</Text>
              <Text style={styles.detailValue}>45 (Good)</Text>
            </View>
          </View>
        </View>
      )}

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
              <Text style={styles.hourIcon}>{getWeatherIcon(hour.condition)}</Text>
              <Text style={styles.hourTemp}>{hour.temp}°C</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  currentWeatherCard: {
    backgroundColor: '#FFF',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIcon: {
    fontSize: 48,
    marginRight: 20,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  condition: {
    fontSize: 18,
    color: '#333',
    textTransform: 'capitalize',
  },
  feelsLike: {
    fontSize: 14,
    color: '#666',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  recommendationCard: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  recommendationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  bestTimesCard: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlot: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 10,
  },
  noTimesText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    paddingLeft: 10,
  },
  hourlyForecastCard: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  forecastScroll: {
    marginTop: 10,
  },
  hourCard: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 80,
  },
  hourTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  hourIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  hourTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9500',
    marginBottom: 4,
  },
  hourCondition: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#FFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tip: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 10,
  },
  refreshButton: {
    backgroundColor: '#FF9500',
    margin: 20,
    marginTop: 0,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

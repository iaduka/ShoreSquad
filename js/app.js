/**
 * ShoreSquad App - Modern JavaScript Foundation
 * Features: Geolocation, Weather API, Local Storage, Progressive Enhancement
 * Target: Young eco-activists organizing beach cleanups
 */

// ===================================
// App Configuration & Constants
// ===================================

const APP_CONFIG = {
  name: 'ShoreSquad',
  version: '1.0.0',
  api: {
    weather: 'https://api.openweathermap.org/data/2.5',
    // Note: Replace with your actual API key
    weatherApiKey: 'your-openweather-api-key-here',
    geocoding: 'https://api.openweathermap.org/geo/1.0'
  },
  storage: {
    userPrefs: 'shoresquad-user-prefs',
    crewData: 'shoresquad-crew-data',
    cleanupStats: 'shoresquad-cleanup-stats',
    weatherCache: 'shoresquad-weather-cache'
  },
  defaults: {
    location: { lat: 33.7490, lng: -118.4065 }, // Redondo Beach, CA
    weatherCacheDuration: 10 * 60 * 1000, // 10 minutes
    animationDuration: 300,
    debounceDelay: 300
  }
};

// ===================================
// Utility Functions
// ===================================

class Utils {
  // Debounce function for performance optimization
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function for scroll/resize events
  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Format numbers with animations
  static animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(start + (end - start) * this.easeOutCubic(progress));
      element.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  // Easing function for smooth animations
  static easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Format date for display
  static formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  // Show toast notifications
  static showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'error' ? '#FF6B6B' : type === 'success' ? '#20B2AA' : '#0077BE'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1060;
      animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

// ===================================
// Local Storage Manager
// ===================================

class StorageManager {
  static set(key, value) {
    try {
      const data = {
        value,
        timestamp: Date.now(),
        version: APP_CONFIG.version
      };
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.warn('Storage failed:', error);
      return false;
    }
  }

  static get(key, maxAge = null) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const data = JSON.parse(item);
      
      // Check if data has expired
      if (maxAge && Date.now() - data.timestamp > maxAge) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.warn('Storage retrieval failed:', error);
      return null;
    }
  }

  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Storage removal failed:', error);
      return false;
    }
  }

  static clear() {
    try {
      // Only clear ShoreSquad data
      Object.values(APP_CONFIG.storage).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.warn('Storage clear failed:', error);
      return false;
    }
  }
}

// ===================================
// Geolocation Service
// ===================================

class GeolocationService {
  static async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          StorageManager.set('last-location', coords);
          resolve(coords);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          // Fallback to stored location or default
          const fallback = StorageManager.get('last-location') || APP_CONFIG.defaults.location;
          resolve(fallback);
        },
        { ...defaultOptions, ...options }
      );
    });
  }

  static watchPosition(callback, options = {}) {
    if (!navigator.geolocation) {
      Utils.showToast('Location services not available', 'error');
      return null;
    }

    return navigator.geolocation.watchPosition(
      callback,
      (error) => console.warn('Position watch error:', error),
      options
    );
  }
}

// ===================================
// Weather Service
// ===================================

class WeatherService {
  static async getCurrentWeather(lat, lng) {
    const cacheKey = `weather-${lat}-${lng}`;
    const cached = StorageManager.get(cacheKey, APP_CONFIG.defaults.weatherCacheDuration);
    
    if (cached) {
      return cached;
    }

    try {
      const url = `${APP_CONFIG.api.weather}/weather?lat=${lat}&lon=${lng}&appid=${APP_CONFIG.api.weatherApiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      const weatherData = this.formatWeatherData(data);
      
      StorageManager.set(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.warn('Weather fetch failed:', error);
      Utils.showToast('Weather data unavailable', 'error');
      return this.getMockWeatherData();
    }
  }

  static async getForecast(lat, lng) {
    try {
      const url = `${APP_CONFIG.api.weather}/forecast?lat=${lat}&lon=${lng}&appid=${APP_CONFIG.api.weatherApiKey}&units=metric`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.formatForecastData(data);
    } catch (error) {
      console.warn('Forecast fetch failed:', error);
      return this.getMockForecastData();
    }
  }

  static formatWeatherData(data) {
    return {
      temperature: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      windDirection: data.wind.deg,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // Convert to kilometers
      location: data.name,
      timestamp: Date.now()
    };
  }

  static formatForecastData(data) {
    return data.list.slice(0, 5).map(item => ({
      date: new Date(item.dt * 1000),
      temperature: {
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min)
      },
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6) // Convert m/s to km/h
    }));
  }

  static getMockWeatherData() {
    return {
      temperature: 22, // Changed to Celsius
      description: 'partly cloudy',
      icon: '02d',
      humidity: 65,
      windSpeed: 13, // Changed to km/h
      windDirection: 270,
      visibility: 16, // Changed to kilometers
      location: 'Beach Area',
      timestamp: Date.now()
    };
  }

  static getMockForecastData() {
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => ({
      date: new Date(today.getTime() + i * 24 * 60 * 60 * 1000),
      temperature: {
        high: Math.round(21 + Math.random() * 8), // 21-29°C range
        low: Math.round(15 + Math.random() * 6)  // 15-21°C range
      },
      description: ['sunny', 'partly cloudy', 'cloudy', 'windy'][Math.floor(Math.random() * 4)],
      icon: '02d',
      humidity: Math.round(50 + Math.random() * 30),
      windSpeed: Math.round(8 + Math.random() * 16) // 8-24 km/h range
    }));
  }
}

// ===================================
// Crew Management
// ===================================

class CrewManager {
  static getCrew() {
    return StorageManager.get(APP_CONFIG.storage.crewData) || {
      members: [],
      cleanups: [],
      stats: {
        totalCleanups: 0,
        totalTrashCollected: 0,
        totalMembers: 0
      }
    };
  }

  static addMember(member) {
    const crew = this.getCrew();
    const newMember = {
      id: Date.now(),
      name: member.name,
      email: member.email,
      joinDate: new Date().toISOString(),
      cleanupCount: 0,
      trashCollected: 0
    };
    
    crew.members.push(newMember);
    crew.stats.totalMembers = crew.members.length;
    StorageManager.set(APP_CONFIG.storage.crewData, crew);
    
    Utils.showToast(`${member.name} joined the crew!`, 'success');
    return newMember;
  }

  static addCleanup(cleanup) {
    const crew = this.getCrew();
    const newCleanup = {
      id: Date.now(),
      date: cleanup.date || new Date().toISOString(),
      location: cleanup.location,
      participants: cleanup.participants || [],
      trashCollected: cleanup.trashCollected || 0,
      duration: cleanup.duration || 0
    };
    
    crew.cleanups.push(newCleanup);
    crew.stats.totalCleanups = crew.cleanups.length;
    crew.stats.totalTrashCollected += newCleanup.trashCollected;
    
    StorageManager.set(APP_CONFIG.storage.crewData, crew);
    Utils.showToast('Cleanup logged successfully!', 'success');
    
    return newCleanup;
  }

  static updateStats() {
    const crew = this.getCrew();
    
    // Update DOM elements
    const elements = {
      cleanupCount: document.getElementById('cleanup-count'),
      crewSize: document.getElementById('crew-size'),
      trashCollected: document.getElementById('trash-collected')
    };

    if (elements.cleanupCount) {
      Utils.animateNumber(elements.cleanupCount, 0, crew.stats.totalCleanups);
    }
    if (elements.crewSize) {
      Utils.animateNumber(elements.crewSize, 0, crew.stats.totalMembers);
    }
    if (elements.trashCollected) {
      Utils.animateNumber(elements.trashCollected, 0, crew.stats.totalTrashCollected);
    }
  }
}

// ===================================
// UI Manager
// ===================================

class UIManager {
  static init() {
    this.setupNavigation();
    this.setupLoadingStates();
    this.setupInteractivity();
    this.handleAccessibility();
  }

  static setupNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
        
        // Animate hamburger
        navToggle.classList.toggle('active');
      });
    }

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            
            // Close mobile menu
            if (navMenu) {
              navMenu.classList.remove('active');
              if (navToggle) {
                navToggle.setAttribute('aria-expanded', 'false');
                navToggle.classList.remove('active');
              }
            }
          }
        }
      });
    });

    // Update active navigation on scroll
    this.setupScrollSpy();
  }

  static setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const targetId = entry.target.id;
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${targetId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, { threshold: 0.5 });

    sections.forEach(section => observer.observe(section));
  }

  static setupLoadingStates() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Hide loading overlay after initial load
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (loadingOverlay) {
          loadingOverlay.classList.remove('active');
        }
      }, 500);
    });
  }

  static setupInteractivity() {
    // Button interactions
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        // Add ripple effect
        this.addRippleEffect(e.target, e);
      });
    });

    // Form validation and submission
    this.setupForms();
  }

  static addRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.6);
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  static setupForms() {
    // Handle form submissions with proper validation
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.validateAndSubmitForm(form);
      });
    });
  }

  static validateAndSubmitForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Basic validation
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
        field.focus();
      } else {
        field.classList.remove('error');
      }
    });
    
    if (isValid) {
      Utils.showToast('Form submitted successfully!', 'success');
      form.reset();
    } else {
      Utils.showToast('Please fill in all required fields', 'error');
    }
  }

  static handleAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any open menus or modals
        const activeMenu = document.querySelector('.nav-menu.active');
        if (activeMenu) {
          activeMenu.classList.remove('active');
          const toggle = document.querySelector('.nav-toggle');
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.classList.remove('active');
          }
        }
      }
    });

    // Focus management for better keyboard navigation
    this.setupFocusManagement();
  }

  static setupFocusManagement() {
    // Trap focus in mobile menu when open
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navMenu) {
      navMenu.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const focusableElements = navMenu.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])');
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }
  }
}

// ===================================
// App Initialization
// ===================================

class ShoreSquadApp {
  constructor() {
    this.isInitialized = false;
    this.currentLocation = null;
    this.weatherData = null;
  }

  async init() {
    if (this.isInitialized) return;

    console.log(`🌊 ${APP_CONFIG.name} v${APP_CONFIG.version} initializing...`);

    try {
      // Initialize UI
      UIManager.init();
      
      // Get user location
      this.currentLocation = await GeolocationService.getCurrentPosition();
      console.log('📍 Location acquired:', this.currentLocation);
      
      // Load weather data
      await this.loadWeatherData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update crew statistics
      CrewManager.updateStats();
      
      // Initialize map functionality
      initializeMap();
      
      // Initialize beach selection
      initializeBeachSelection();
      
      // Mark as initialized
      this.isInitialized = true;
      
      Utils.showToast('ShoreSquad ready! 🌊', 'success');
      console.log('✅ ShoreSquad initialized successfully');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      Utils.showToast('App initialization failed', 'error');
    }
  }

  async loadWeatherData() {
    if (!this.currentLocation) return;
    
    const weatherContainer = document.querySelector('.weather-current');
    
    try {
      // Show loading state
      if (weatherContainer) {
        weatherContainer.innerHTML = `
          <div class="weather-loading">
            <div class="loading-spinner"></div>
            <p>Fetching weather data...</p>
          </div>
        `;
      }
      
      // Fetch current weather
      this.weatherData = await WeatherService.getCurrentWeather(
        this.currentLocation.lat,
        this.currentLocation.lng
      );
      
      // Fetch forecast
      const forecastData = await WeatherService.getForecast(
        this.currentLocation.lat,
        this.currentLocation.lng
      );
      
      // Update UI
      this.updateWeatherUI(this.weatherData, forecastData);
      
    } catch (error) {
      console.error('Weather loading failed:', error);
      if (weatherContainer) {
        weatherContainer.innerHTML = '<p>Weather data unavailable</p>';
      }
    }
  }

  updateWeatherUI(current, forecast) {
    const weatherContainer = document.querySelector('.weather-current');
    const forecastContainer = document.querySelector('.weather-forecast');
    
    if (weatherContainer && current) {
      weatherContainer.innerHTML = `
        <div class="weather-card">
          <div class="weather-header">
            <h3>${current.location}</h3>
            <div class="weather-icon">
              <img src="https://openweathermap.org/img/w/${current.icon}.png" alt="${current.description}">
            </div>
          </div>
          <div class="weather-main">
            <span class="temperature">${current.temperature}°C</span>
            <span class="description">${current.description}</span>
          </div>
          <div class="weather-details">
            <div class="detail">
              <span class="label">Humidity</span>
              <span class="value">${current.humidity}%</span>
            </div>
            <div class="detail">
              <span class="label">Wind</span>
              <span class="value">${current.windSpeed} km/h</span>
            </div>
            ${current.visibility ? `
              <div class="detail">
                <span class="label">Visibility</span>
                <span class="value">${current.visibility} km</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    if (forecastContainer && forecast) {
      forecastContainer.innerHTML = `
        <h4>5-Day Forecast</h4>
        <div class="forecast-grid">
          ${forecast.map(day => `
            <div class="forecast-day">
              <div class="forecast-date">${Utils.formatDate(day.date)}</div>
              <img src="https://openweathermap.org/img/w/${day.icon}.png" alt="${day.description}">
              <div class="forecast-temps">
                <span class="high">${day.temperature.high}°</span>
                <span class="low">${day.temperature.low}°</span>
              </div>
              <div class="forecast-desc">${day.description}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  setupEventListeners() {
    // Find cleanup spots button
    const findCleanupBtn = document.getElementById('find-cleanup-btn');
    if (findCleanupBtn) {
      findCleanupBtn.addEventListener('click', () => {
        this.navigateToSection('map');
        Utils.showToast('Loading beach locations...', 'info');
        this.loadMapData();
      });
    }

    // Check weather button
    const checkWeatherBtn = document.getElementById('check-weather-btn');
    if (checkWeatherBtn) {
      checkWeatherBtn.addEventListener('click', () => {
        this.navigateToSection('weather');
        this.loadWeatherData();
      });
    }

    // Locate button
    const locateBtn = document.getElementById('locate-btn');
    if (locateBtn) {
      locateBtn.addEventListener('click', async () => {
        try {
          Utils.showToast('Getting your location...', 'info');
          this.currentLocation = await GeolocationService.getCurrentPosition();
          await this.loadWeatherData();
          
          // Open Google Maps with directions from user location to selected beach
          const beach = SINGAPORE_BEACHES[currentBeach];
          const mapsUrl = `https://www.google.com/maps/dir/${this.currentLocation.lat},${this.currentLocation.lng}/${beach.coordinates.lat},${beach.coordinates.lng}`;
          window.open(mapsUrl, '_blank');
          
          Utils.showToast('Opening directions to cleanup location!', 'success');
        } catch (error) {
          Utils.showToast('Location access denied', 'error');
        }
      });
    }

    // Invite crew button
    const inviteBtn = document.getElementById('invite-crew-btn');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', () => {
        this.showInviteModal();
      });
    }

    // Create event button
    const createEventBtn = document.getElementById('create-event-btn');
    if (createEventBtn) {
      createEventBtn.addEventListener('click', () => {
        this.showCreateEventModal();
      });
    }
  }

  navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }

  loadMapData() {
    // Map is now embedded directly, but we can update the info overlay
    const mapContainer = document.getElementById('beach-map');
    if (mapContainer) {
      Utils.showToast('Map loaded: Pasir Ris Beach cleanup location', 'success');
      
      // Update any dynamic content related to the map
      this.updateCleanupInfo();
    }
  }

  updateCleanupInfo() {
    // Add any dynamic updates to the cleanup information
    const now = new Date();
    const cleanupDate = new Date();
    cleanupDate.setDate(now.getDate() + 7); // Next week
    
    console.log(`Next cleanup scheduled for: ${cleanupDate.toLocaleDateString()}`);
    console.log('Location: Pasir Ris Beach, Singapore');
    console.log('Coordinates: 1.381497, 103.955574');
  }

  showInviteModal() {
    // Simplified modal for demo - in production, use proper modal component
    const name = prompt('Enter friend\'s name:');
    const email = prompt('Enter friend\'s email:');
    
    if (name && email) {
      CrewManager.addMember({ name, email });
      CrewManager.updateStats();
    }
  }

  showCreateEventModal() {
    // Simplified event creation for demo
    const location = prompt('Cleanup location:');
    const date = prompt('Date (YYYY-MM-DD):') || new Date().toISOString().split('T')[0];
    
    if (location) {
      CrewManager.addCleanup({
        location,
        date: new Date(date).toISOString(),
        trashCollected: Math.floor(Math.random() * 50) + 10 // Demo data
      });
      CrewManager.updateStats();
    }
  }
}

// ===================================
// App Launch
// ===================================

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ShoreSquadApp();
  app.init();
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  @keyframes ripple {
    from { transform: scale(0); opacity: 1; }
    to { transform: scale(2); opacity: 0; }
  }
  
  .btn.error {
    border-color: #FF6B6B;
    box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
  }
  
  .weather-card {
    text-align: center;
  }
  
  .weather-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .temperature {
    font-size: 3rem;
    font-weight: 800;
    color: var(--primary-blue);
    display: block;
  }
  
  .description {
    text-transform: capitalize;
    color: var(--medium-gray);
    font-weight: 500;
  }
  
  .weather-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .detail {
    text-align: center;
  }
  
  .detail .label {
    display: block;
    font-size: 0.875rem;
    color: var(--medium-gray);
    margin-bottom: 0.25rem;
  }
  
  .detail .value {
    font-weight: 600;
    color: var(--charcoal);
  }
  
  .forecast-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .forecast-day {
    text-align: center;
    padding: 1rem;
    background: rgba(0, 119, 190, 0.05);
    border-radius: 8px;
  }
  
  .forecast-date {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--primary-blue);
  }
  
  .forecast-temps {
    margin: 0.5rem 0;
  }
  
  .forecast-temps .high {
    font-weight: 600;
    margin-right: 0.5rem;
  }
  
  .forecast-temps .low {
    color: var(--medium-gray);
  }
  
  .forecast-desc {
    font-size: 0.75rem;
    text-transform: capitalize;
    color: var(--medium-gray);
  }
  
  .map-content {
    text-align: center;
    padding: 2rem;
    color: var(--white);
  }
  
  .beach-list {
    margin-top: 1rem;
  }
  
  .beach-item {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.75rem;
    margin: 0.5rem 0;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }
`;

document.head.appendChild(style);

// ===================================
// Beach Locations Data
// ===================================

const SINGAPORE_BEACHES = {
  'pasir-ris': {
    name: 'Pasir Ris Beach',
    coordinates: { lat: 1.381497, lng: 103.955574 },
    description: 'Street View Asia Location',
    features: ['Family-friendly', 'Large area', 'Easy access'],
    mapUrl: 'https://maps.google.com/maps?width=100%25&height=400&hl=en&q=1.381497,103.955574+(Pasir%20Ris%20Beach%20Cleanup)&t=&z=16&ie=UTF8&iwloc=B&output=embed'
  },
  'east-coast': {
    name: 'East Coast Park Beach',
    coordinates: { lat: 1.3010, lng: 103.9124 },
    description: 'Popular recreational beach with cycling path',
    features: ['Cycling path', 'BBQ pits', 'High foot traffic'],
    mapUrl: 'https://maps.google.com/maps?width=100%25&height=400&hl=en&q=1.3010,103.9124+(East%20Coast%20Park%20Beach%20Cleanup)&t=&z=16&ie=UTF8&iwloc=B&output=embed'
  },
  'palawan': {
    name: 'Palawan Beach, Sentosa',
    coordinates: { lat: 1.2494, lng: 103.8303 },
    description: 'Southernmost point of continental Asia',
    features: ['Tourist area', 'Suspension bridge', 'Clear waters'],
    mapUrl: 'https://maps.google.com/maps?width=100%25&height=400&hl=en&q=1.2494,103.8303+(Palawan%20Beach%20Sentosa%20Cleanup)&t=&z=16&ie=UTF8&iwloc=B&output=embed'
  },
  'changi': {
    name: 'Changi Beach',
    coordinates: { lat: 1.3890, lng: 103.9834 },
    description: 'Historic beach with coastal boardwalk',
    features: ['Historic significance', 'Boardwalk', 'Mangrove views'],
    mapUrl: 'https://maps.google.com/maps?width=100%25&height=400&hl=en&q=1.3890,103.9834+(Changi%20Beach%20Cleanup)&t=&z=16&ie=UTF8&iwloc=B&output=embed'
  }
};

let currentBeach = 'pasir-ris';

// ===================================
// Beach Selection Functions
// ===================================

// Change beach location when user selects from dropdown
function changeBeachLocation() {
  const select = document.getElementById('beach-select');
  if (!select) return;
  
  const selectedBeach = select.value;
  const beach = SINGAPORE_BEACHES[selectedBeach];
  
  if (!beach) return;
  
  currentBeach = selectedBeach;
  
  // Update map
  const mapFrame = document.getElementById('beach-map');
  if (mapFrame) {
    mapFrame.src = beach.mapUrl;
  }
  
  // Update info display
  const beachInfo = document.getElementById('beach-info');
  if (beachInfo) {
    beachInfo.innerHTML = `
      <p><strong>${beach.name}</strong></p>
      <p>📅 Coordinates: ${beach.coordinates.lat}, ${beach.coordinates.lng}</p>
      <p>🏖️ ${beach.description}</p>
      <p>✨ ${beach.features.join(', ')}</p>
    `;
  }
  
  // Store selection in local storage
  StorageManager.set('selected-beach', selectedBeach);
  
  Utils.showToast(`Switched to ${beach.name}`, 'success');
}

// Get directions to selected beach
function getDirections() {
  const beach = SINGAPORE_BEACHES[currentBeach];
  if (!beach) return;
  
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${beach.coordinates.lat},${beach.coordinates.lng}`;
  window.open(mapsUrl, '_blank');
  
  Utils.showToast(`Opening directions to ${beach.name}`, 'info');
}

// Share beach location with crew
function shareLocation() {
  const beach = SINGAPORE_BEACHES[currentBeach];
  if (!beach) return;
  
  const shareText = `Join our beach cleanup at ${beach.name}! 🌊\n📍 ${beach.description}\n📅 Coordinates: ${beach.coordinates.lat}, ${beach.coordinates.lng}\n🗺️ https://www.google.com/maps/place/${beach.coordinates.lat},${beach.coordinates.lng}`;
  
  if (navigator.share) {
    navigator.share({
      title: 'ShoreSquad Beach Cleanup',
      text: shareText,
      url: window.location.href
    }).catch(err => {
      console.log('Share failed:', err);
      copyToClipboard(shareText);
    });
  } else {
    copyToClipboard(shareText);
  }
}

// Copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      Utils.showToast('Location details copied to clipboard!', 'success');
    }).catch(() => {
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

// Fallback copy function for older browsers
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    Utils.showToast('Location details copied to clipboard!', 'success');
  } catch (err) {
    Utils.showToast('Please copy the location details manually', 'info');
    console.log('Copy failed:', err);
  }
  
  document.body.removeChild(textArea);
}

// Initialize beach selection from stored preference
function initializeBeachSelection() {
  const savedBeach = StorageManager.get('selected-beach');
  if (savedBeach && SINGAPORE_BEACHES[savedBeach]) {
    currentBeach = savedBeach;
    const select = document.getElementById('beach-select');
    if (select) {
      select.value = savedBeach;
      changeBeachLocation();
    }
  }
}

// ===================================
// Global Map Functions
// ===================================

// Toggle between different map views
function toggleMapView(viewType) {
  const mapFrame = document.getElementById('beach-map');
  if (!mapFrame) return;
  
  const baseUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.639546442087!2d103.95339731475391!3d1.3814970987041962!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da3d8d0a05a851%3A0x1f7e3e0b8a0f8d0a!2sPasir%20Ris%20Beach!';
  
  let mapTypeParam;
  switch (viewType) {
    case 'satellite':
      mapTypeParam = '5e1!3m2!1sen!2ssg!4v1701604800000!5m2!1sen!2ssg'; // Satellite view
      break;
    case 'roadmap':
      mapTypeParam = '5e0!3m2!1sen!2ssg!4v1701604800000!5m2!1sen!2ssg'; // Road view
      break;
    default:
      mapTypeParam = '5e0!3m2!1sen!2ssg!4v1701604800000!5m2!1sen!2ssg';
  }
  
  mapFrame.src = baseUrl + mapTypeParam;
  Utils.showToast(`Switched to ${viewType} view`, 'success');
}

// Initialize map with fallback options
function initializeMap() {
  const mapFrame = document.getElementById('beach-map');
  if (!mapFrame) return;
  
  // Add error handling for map loading
  mapFrame.addEventListener('error', () => {
    console.warn('Primary map failed to load, trying fallback...');
    
    // Fallback to a simpler embed URL
    mapFrame.src = 'https://maps.google.com/maps?width=100%25&amp;height=400&amp;hl=en&amp;q=1.381497,103.955574+(Pasir%20Ris%20Beach%20Cleanup)&amp;t=&amp;z=16&amp;ie=UTF8&amp;iwloc=B&amp;output=embed';
    
    // If that fails too, show a static fallback
    setTimeout(() => {
      if (mapFrame.src.includes('fallback')) {
        mapFrame.outerHTML = `
          <div id="beach-map" class="map-fallback" style="height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, var(--primary-blue), var(--seafoam-green)); color: white; text-align: center; border-radius: var(--border-radius-lg);">
            <h3>🏖️ Pasir Ris Beach Cleanup</h3>
            <p><strong>Coordinates:</strong> 1.381497, 103.955574</p>
            <button class="btn btn-primary" onclick="window.open('https://www.google.com/maps/place/1.381497,103.955574', '_blank')" style="margin-top: 1rem;">
              🗺️ Open in Google Maps
            </button>
          </div>
        `;
      }
    }, 3000);
  });
  
  // Success callback
  mapFrame.addEventListener('load', () => {
    console.log('✅ Google Maps loaded successfully');
    Utils.showToast('Map loaded successfully! 🗺️', 'success');
  });
}

// Add to window for global access
window.toggleMapView = toggleMapView;
window.initializeMap = initializeMap;
window.changeBeachLocation = changeBeachLocation;
window.getDirections = getDirections;
window.shareLocation = shareLocation;
window.initializeBeachSelection = initializeBeachSelection;

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShoreSquadApp, Utils, StorageManager };
}
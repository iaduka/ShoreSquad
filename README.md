# 🌊 ShoreSquad - Beach Cleanup Rally App

**Rally your crew, track weather, and hit the next beach cleanup with our dope map app!**

ShoreSquad mobilizes young people to clean beaches using weather tracking, interactive maps, and social features that make eco-action fun and connected.

## ✨ Features

- 🗺️ **Interactive Maps**: Find nearby beaches perfect for cleanup activities
- ⛅ **Weather Integration**: Real-time weather data and 5-day forecasts
- 👥 **Crew Management**: Organize your cleanup squad and track participation
- 📱 **Mobile-First**: Optimized for smartphones with touch-friendly interface
- 🎯 **Accessibility**: WCAG 2.1 compliant with screen reader support
- 💾 **Offline Support**: Works without internet using cached data
- 🎨 **Ocean-Themed UI**: Beautiful gradients inspired by the sea

## 🎨 Design System

### Color Palette
- **Primary Ocean Blue**: `#0077BE` - Trust, environmental action
- **Seafoam Green**: `#20B2AA` - Nature, freshness, renewal
- **Sandy Beige**: `#F5DEB3` - Beach vibes, warmth
- **Coral Accent**: `#FF6B6B` - Energy, social connection
- **Deep Teal**: `#008B8B` - Depth, reliability

### Typography
- **Display Font**: Poppins (headings)
- **Body Font**: Inter (content)
- **Fluid Typography**: Responsive font sizes using clamp()

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- VS Code with Live Server extension (recommended)
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd ShoreSquad_Dev
   ```

2. **Open in VS Code**
   ```bash
   code .
   ```

3. **Start Live Server**
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Or press `Alt + L + O`

4. **View in browser**
   - Navigate to `http://localhost:3000`
   - The app will auto-reload on file changes

### Weather API Setup

1. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. Replace `'your-openweather-api-key-here'` in `js/app.js`
3. The app includes mock data for development without an API key

## 📱 Mobile Experience

ShoreSquad is designed mobile-first for the beach cleanup generation:

- **Thumb-Friendly**: 44px minimum touch targets
- **Outdoor Readable**: High contrast for bright sunlight
- **Progressive Enhancement**: Works on older devices
- **Offline Ready**: Cached weather and location data

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern features with custom properties and grid
- **JavaScript ES6+**: Classes, modules, async/await, local storage
- **Progressive Web App**: Service worker ready

### APIs & Services
- **Geolocation API**: Find user location
- **OpenWeather API**: Weather data and forecasts
- **Local Storage**: Offline data persistence
- **Intersection Observer**: Smooth scroll animations

### Development Tools
- **VS Code**: Recommended editor
- **Live Server**: Hot reload development
- **Git**: Version control
- **Chrome DevTools**: Debugging and testing

## 🌐 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ⚠️ Internet Explorer: Not supported

## 📋 Project Structure

```
ShoreSquad_Dev/
├── index.html              # Main HTML file
├── css/
│   └── styles.css         # All styles with CSS custom properties
├── js/
│   └── app.js            # Main application logic
├── .vscode/
│   └── settings.json     # VS Code Live Server configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🎯 UX Design Principles

### For Young Eco-Activists
- **Gamification**: Progress tracking and achievement system
- **Social Connection**: Easy crew invitation and coordination
- **Visual Feedback**: Animations and micro-interactions
- **Accessibility**: Screen reader support and keyboard navigation

### Mobile-First Approach
- **Progressive Disclosure**: Simple interface that reveals complexity
- **Touch Optimization**: Large buttons and swipe gestures
- **Performance**: Fast loading with lazy loading techniques
- **Offline**: Works in areas with poor connectivity

## 🔧 Customization

### Adding New Features
1. Create new classes in `js/app.js`
2. Add corresponding CSS in `css/styles.css`
3. Update HTML structure if needed
4. Test across devices and browsers

### Styling Guidelines
- Use CSS custom properties for consistent theming
- Follow mobile-first responsive design
- Maintain accessibility standards
- Keep ocean-inspired color palette

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Code Style
- Use semantic HTML5 elements
- Follow BEM CSS methodology
- Use modern JavaScript (ES6+)
- Include accessibility attributes
- Comment complex functionality

## 📈 Future Enhancements

- [ ] **Real Maps Integration**: Google Maps or Mapbox
- [ ] **Push Notifications**: Event reminders and weather alerts
- [ ] **Photo Sharing**: Before/after cleanup photos
- [ ] **Gamification**: Badges and leaderboards
- [ ] **Social Login**: Easy onboarding with social accounts
- [ ] **Multilingual**: Support for multiple languages
- [ ] **Dark Mode**: Theme switching capability

## 🐛 Known Issues

- Weather API requires internet connection
- Geolocation needs user permission
- Some animations may be reduced on slower devices

## 📞 Support

For issues, questions, or contributions:
- Create an issue in the repository
- Check existing documentation
- Review browser console for errors

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenWeatherMap** for weather data API
- **VS Code Live Server** for development server
- **Ocean conservation organizations** for inspiration
- **Young environmental activists** worldwide

---

**Made with 💙 for cleaner oceans** 🌊

*ShoreSquad - Where beach cleanup meets social connection*
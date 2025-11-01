# 🚌 ConnectMe: Smart College Bus Tracking

<div align="center">

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

Real-time bus tracking system built with React Native, Node.js, and MongoDB. Track college buses in real-time, get ETAs, and never miss your bus again! 🎯

[Features](#-features) •
[Installation](#-installation) •
[Tech Stack](#-tech-stack) •
[Screenshots](#-screenshots) •
[Contributing](#-contributing)

<p align="center">
  <img src="frontend/assets/images/app-preview.gif" alt="ConnectMe App Demo" width="230">
</p>

</div>

## ✨ Key Features

### 📱 Student Features
<table>
<tr>
    <td width="50%">
        <h4>🗺️ Real-time Tracking</h4>
        <ul>
            <li>Live bus location on interactive map</li>
            <li>Accurate ETA for each stop</li>
            <li>Complete route visualization</li>
        </ul>
    </td>
    <td width="50%">
        <h4>🔔 Smart Notifications</h4>
        <ul>
            <li>Bus arrival alerts</li>
            <li>Schedule changes updates</li>
            <li>Emergency notifications</li>
        </ul>
    </td>
</tr>
<tr>
    <td width="50%">
        <h4>📅 Schedule Management</h4>
        <ul>
            <li>View bus timings for each stop</li>
            <li>Access journey history</li>
            <li>Favorite routes & stops</li>
        </ul>
    </td>
    <td width="50%">
        <h4>📊 Journey Analytics</h4>
        <ul>
            <li>Travel time statistics</li>
            <li>Delay predictions</li>
            <li>Route efficiency insights</li>
        </ul>
    </td>
</tr>
</table>

### 🚌 Driver Features
<table>
<tr>
    <td width="50%">
        <h4>🎯 Trip Management</h4>
        <ul>
            <li>One-touch trip start/end</li>
            <li>Automatic location updates</li>
            <li>Route navigation assistance</li>
        </ul>
    </td>
    <td width="50%">
        <h4>👥 Passenger Insights</h4>
        <ul>
            <li>Students waiting at stops</li>
            <li>Real-time occupancy tracking</li>
            <li>Schedule adherence monitoring</li>
        </ul>
    </td>
</tr>
</table>

### 👨‍💼 Admin Features
<table>
<tr>
    <td width="50%">
        <h4>🎮 Fleet Management</h4>
        <ul>
            <li>Real-time fleet monitoring</li>
            <li>Driver assignment system</li>
            <li>Route optimization tools</li>
        </ul>
    </td>
    <td width="50%">
        <h4>📈 Analytics Dashboard</h4>
        <ul>
            <li>Comprehensive transport statistics</li>
            <li>Performance metrics</li>
            <li>Custom report generation</li>
        </ul>
    </td>
</tr>
</table>

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- Socket.io Client

### Backend
- Node.js & Express
- TypeScript
- MongoDB & Mongoose
- Socket.io
- JWT Authentication

## 📱 Screenshots

<div align="center">
<img src="docs/images/login.png" width="200"> <img src="docs/images/map.png" width="200"> <img src="docs/images/stops.png" width="200">
</div>

### System Requirements

<table>
<tr>
    <td>
        <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
    </td>
    <td>
        v18.0.0 or higher
    </td>
    <td>
        <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
    </td>
    <td>
        v5.0.0 or higher
    </td>
</tr>
<tr>
    <td>
        <img src="https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
    </td>
    <td>
        Latest version
    </td>
    <td>
        <img src="https://img.shields.io/badge/Android%20Studio-3DDC84.svg?style=for-the-badge&logo=android-studio&logoColor=white" alt="Android Studio"/>
    </td>
    <td>
        For Android builds
    </td>
</tr>
<tr>
    <td>
        <img src="https://img.shields.io/badge/Xcode-007ACC?style=for-the-badge&logo=Xcode&logoColor=white" alt="Xcode"/>
    </td>
    <td>
        For iOS builds
    </td>
    <td>
        <img src="https://img.shields.io/badge/git-%23F05033.svg?style=for-the-badge&logo=git&logoColor=white" alt="Git"/>
    </td>
    <td>
        Latest version
    </td>
</tr>
</table>

### Backend Setup

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/Chiranth-Janardhan-moger/Connect_Me.git
   cd Connect_Me/backend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Start Production Server**
   ```bash
   npm run build
   npm start
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your backend API URL
   ```

3. **Start Development Server**
   ```bash
   npx expo start
   ```

### Building Mobile Apps

#### Android APK
```bash
# Generate Android files
npx expo prebuild --platform android --clean

# Build Debug APK
cd android
./gradlew assembleDebug

# Build Release APK
./gradlew assembleRelease
```
The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

#### iOS App
```bash
# Generate iOS files
npx expo prebuild --platform ios --clean

# Open Xcode project
cd ios
open ConnectMe.xcworkspace

# Build using Xcode
# Product > Archive
```

## 🎯 Future Roadmap

<div align="center">
<table>
<tr>
    <td align="center" width="33%">
        <h3>🌟 Phase 1</h3>
        <h4>Enhanced Location</h4>
        <br/>
        <p>
            ⭐ Offline support<br/>
            ⭐ Background tracking<br/>
            ⭐ Geofencing alerts<br/>
            ⭐ Location prediction<br/>
            ⭐ Better GPS accuracy
        </p>
        <br/>
        <h4>Q4 2025</h4>
    </td>
    <td align="center" width="33%">
        <h3>🌟 Phase 2</h3>
        <h4>Smart Features</h4>
        <br/>
        <p>
            ⭐ Seat reservation<br/>
            ⭐ QR code boarding<br/>
            ⭐ Bus occupancy live<br/>
            ⭐ Smart notifications<br/>
            ⭐ Voice commands
        </p>
        <br/>
        <h4>Q1 2026</h4>
    </td>
    <td align="center" width="33%">
        <h3>🌟 Phase 3</h3>
        <h4>AI & Analytics</h4>
        <br/>
        <p>
            ⭐ AI-powered ETAs<br/>
            ⭐ Route optimization<br/>
            ⭐ Predictive alerts<br/>
            ⭐ Carbon tracking<br/>
            ⭐ Smart scheduling
        </p>
        <br/>
        <h4>Q2 2026</h4>
    </td>
</tr>
</table>
</div>

<div align="center">
<br/>

[![Roadmap Discussion](https://img.shields.io/github/discussions/Chiranth-Janardhan-moger/Connect_Me?style=for-the-badge&logo=github&label=Roadmap%20Discussion&color=blue)](https://github.com/Chiranth-Janardhan-moger/Connect_Me/discussions/categories/roadmap)

</div>

## 👥 Contributing

Contributions are always welcome! 

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 🤝 Contributors

### Core Team

<table>
<tr>
    <td align="center">
        <a href="https://github.com/Chiranth-Janardhan-moger">
            <img src="https://github.com/Chiranth-Janardhan-moger.png" width="100px;" alt="Chiranth Janardhan Moger"/>
            <br />
            <sub><b>Chiranth Janardhan</b></sub>
        </a>
        <br />
        <sub>Project Lead & Full Stack Developer</sub>
    </td>
    <td align="center">
        <a href="https://github.com/xxx">
            <img src="https://github.com/DivyashreG.png" width="100px;" alt="Divyashree"/>
            <br />
            <sub><b>Divyashree G</b></sub>
        </a>
        <br />
        <sub>UI/UX Developer</sub>
    </td>
    <td align="center">
        <a href="https://github.com/amoghar29">
            <img src="https://github.com/amoghar29.png" width="100px;" alt="Amogha"/>
            <br />
            <sub><b>Amogha</b></sub>
        </a>
        <br />
        <sub>Backend Developer</sub>
    </td>
   
</tr>
</table>

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email chiranthmoger7@gmail.com 

## 🌟 Acknowledgments

- [Expo](https://expo.dev/) for the amazing React Native framework
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting
- All our contributors and supporters

---

<div align="center">
Made with ❤️ by <a href="https://github.com/Chiranth-Janardhan-moger">Chiranth Janardhan Moger</a>
</div>



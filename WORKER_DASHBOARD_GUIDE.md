# Worker Dashboard - User Guide

## 🎯 Overview
Dashboard Worker adalah interface khusus untuk pekerja dalam sistem iSafe yang memungkinkan monitoring keselamatan kerja secara real-time dan analisis performa personal.

## 🚀 Quick Start

### 1. Mendapatkan Akun Worker
- Contact administrator untuk dibuatkan akun worker
- Administrator akan membuat akun melalui admin dashboard
- Terima email dan password dari administrator

### 2. Login Worker
1. Akses `/login`
2. Gunakan kredensial worker
3. Sistem akan redirect ke `/worker` (dashboard worker)

## 📊 Fitur Dashboard Worker

### **🏠 Dashboard Utama** (`/worker`)
**Real-time Safety Overview**
- Safety Score personal berdasarkan data sensor
- Status postur (Good/Poor) dengan angle tilt real-time
- Monitoring berat beban (kg) dengan indikator overweight
- Aktivitas otot (EMG) dengan threshold monitoring

**Environmental Monitoring**
- Suhu lingkungan kerja (°C)
- Kelembaban (%RH)
- Data dari sensor BME680 secara real-time

**Performance Summary**
- Total jam kerja minggu ini
- Safety score trending
- Jumlah alert dan work sessions

### **📊 Live Monitoring** (`/worker/monitoring`)
**Real-time Sensor Data**
- Visual indicators untuk postur (angle bars)
- Progress bars untuk berat beban vs threshold
- EMG activity monitoring dengan color coding
- Environmental conditions dashboard

**Active Alerts**
- Dynamic alert generation berdasarkan sensor data
- Real-time feedback untuk koreksi postur
- Warning untuk overweight dan high muscle activity

**Session Control**
- Start/Stop work session
- Session timer dan status

### **🚨 Personal Alerts** (`/worker/alerts`)
**Alert Management**
- Riwayat semua safety alerts personal
- Filter berdasarkan: status, tipe alert, tanggal
- Search functionality untuk mencari alert spesifik
- Detail modal dengan sensor data dan timestamp

**Alert Types**
- **Posture**: Poor posture detection (angle > 45°)
- **Overweight**: Load exceed 27kg threshold
- **EMG**: High muscle activity (strain detection)
- **Environmental**: Temperature/humidity extremes

**Actions**
- Mark alerts as resolved
- View detailed sensor data
- Export alert history

### **📈 Work History** (`/worker/history`)
**Performance Analytics**
- Total working hours dengan trend comparison
- Safety score progression over time
- Work sessions history dengan durasi dan alerts
- Performance metrics per hari/minggu/bulan

**Safety Insights**
- Personalized recommendations berdasarkan data
- Risk assessment (posture, workload, overall)
- Trend analysis dengan visual indicators

**Session Details**
- Table riwayat work sessions
- Duration, alerts count, safety score per session
- Export data untuk analysis external

### **👤 Profile** (`/worker/profile`)
**Personal Information**
- Edit display name dan informasi personal
- Account status dan security information
- Member since information

**Sensor Assignment Status**
- Status sensor yang di-assign (Online/Offline)
- Real-time data preview dari assigned sensor
- Connection troubleshooting info

**Notification Settings**
- Safety alerts on/off
- Break reminders
- Weekly reports subscription
- Shift updates notification

### **📋 Health Report** (`/worker/report`)
**Comprehensive Analysis**
- Executive summary dengan key metrics
- Risk assessment (Low/Medium/High) untuk berbagai aspek
- Weekly performance trends dengan visual charts
- Safety recommendations berdasarkan data pattern

**Report Generation**
- Time range selection (7 days, 30 days, 90 days, 1 year)
- PDF export functionality
- Automated insights dan recommendations
- Professional report format untuk HR/Safety dept

## 🔧 Technical Features

### **Real-time Integration**
- Live data dari ESP32 sensor melalui Firebase Realtime DB
- Auto-sync sensor data setiap 10 detik
- Real-time alerts berdasarkan threshold violations
- Live environmental monitoring

### **Data Analytics**
- Safety score calculation algorithm
- Trend analysis dengan period comparison
- Risk categorization berdasarkan historical data
- Performance metrics calculation

### **Security & Access**
- Role-based access control (worker only)
- Data isolation (worker hanya lihat data sendiri)
- Secure Firebase authentication
- Protected routes dengan automatic redirect

## 🎨 User Experience

### **Modern UI/UX**
- Responsive design (desktop, tablet, mobile)
- Real-time visual feedback dengan color coding
- Interactive components (progress bars, charts)
- Intuitive navigation dengan worker-specific sidebar

### **Visual Indicators**
- Green: Safe/Good condition
- Yellow: Warning/Attention needed
- Red: Danger/Immediate action required
- Progress bars untuk metrics visualization

## 📱 Mobile Responsiveness
- Optimized untuk smartphone dan tablet
- Touch-friendly interface
- Mobile-first sidebar navigation
- Responsive charts dan tables

## 🔗 Integration dengan Admin Dashboard
- Worker assignments managed oleh admin
- Real-time data sharing untuk monitoring
- Alert escalation ke admin jika critical
- Historical data untuk admin reporting

## 🎯 Best Practices untuk Worker

### **Daily Usage**
1. Login dan check dashboard overview
2. Start work session di monitoring page
3. Monitor real-time alerts dan koreksi postur
4. Take breaks berdasarkan recommendations
5. End session dan review performance

### **Weekly Review**
1. Check work history dan trends
2. Review safety score progression
3. Read personalized recommendations
4. Generate health report untuk records

### **Safety Compliance**
1. Respond immediately untuk real-time alerts
2. Maintain good posture (angle < 45°)
3. Avoid overweight lifting (< 27kg)
4. Take breaks untuk prevent muscle fatigue
5. Report issues melalui profile atau quick actions

## 🛠️ Troubleshooting

### **No Sensor Data**
- Contact supervisor untuk sensor assignment
- Check sensor online status di profile
- Restart ESP32 device jika offline

### **Login Issues**
- Ensure account dibuat dengan role 'worker'
- Check credentials dan network connection
- Contact admin jika persistent issues

### **Performance Issues**
- Clear browser cache
- Check internet connection
- Use modern browser (Chrome, Firefox, Safari)
- Disable ad blockers yang might interfere

Dashboard Worker dirancang untuk memberikan worker control penuh atas keselamatan kerja mereka dengan data real-time, insights yang actionable, dan tools untuk continuous improvement.

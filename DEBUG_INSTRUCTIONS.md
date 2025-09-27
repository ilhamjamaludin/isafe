# DEBUG INSTRUCTIONS - Worker Access Issue

## Masalah
Worker tidak bisa mengakses dashboard setelah login, muncul "Access Denied"

## Langkah-langkah Debugging

### 1. **Buat Worker Account melalui Admin Dashboard**
- Login sebagai admin ke dashboard
- Akses halaman Users Management
- Tambahkan user baru dengan role 'worker'
- Pastikan role tersimpan sebagai 'worker' di Firestore

### 2. **Login dengan Worker Account**
Akses: `http://localhost:3000/login`
- Login dengan akun worker yang sudah dibuat
- Perhatikan komponen debug di pojok kiri bawah

### 3. **Periksa Data User di Debug Component**
Komponen debug akan menampilkan:
- ✅ Email user
- ✅ Role user (harus 'worker')
- ✅ UID user
- ✅ Display Name
- ✅ Created Date

### 4. **Kemungkinan Masalah dan Solusi**

#### **A. Role tidak tersimpan dengan benar**
**Gejala**: Debug component menampilkan role kosong atau null
**Solusi**: 
1. Periksa Firestore collection 'users'
2. Pastikan dokumen user memiliki field 'role': 'worker'
3. Update manual di Firebase Console jika perlu

#### **B. AuthContext tidak mengambil data user**
**Gejala**: Debug component menampilkan "No user logged in"
**Solusi**:
1. Periksa Firebase configuration di `.env.local`
2. Pastikan Firestore rules mengizinkan read untuk authenticated users
3. Check network tab untuk error Firebase

#### **C. ProtectedRoute logic error**
**Gejala**: User data benar tapi tetap diredirect ke unauthorized
**Solusi**:
1. Periksa `allowedRoles={['worker']}` di worker layout
2. Pastikan role comparison case-sensitive
3. Debug dengan console.log di ProtectedRoute component

### 5. **Firestore Rules yang Diperlukan**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admins to read all user documents
    match /users/{userId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read/write their own sensor data
    match /sensorHistory/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /alerts/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /workerSensorAssignments/{docId} {
      allow read, write: if request.auth != null;
    }
    
    match /workerActivitySessions/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. **Test Manual di Browser Console**
```javascript
// Test 1: Periksa Firebase Auth
console.log('Firebase Auth:', firebase.auth().currentUser);

// Test 2: Periksa AuthContext
console.log('Auth Context User:', /* cek di React DevTools */);

// Test 3: Test Firebase connection
firebase.firestore().collection('users').doc('test').get()
  .then(doc => console.log('Firestore connected'))
  .catch(err => console.error('Firestore error:', err));
```

### 7. **Redirect Flow yang Benar**
1. Login → `/login-redirect` → Role-based redirect
2. Admin → `/dashboard`
3. Worker → `/worker`
4. Viewer → `/dashboard` (or custom viewer dashboard)
5. Invalid role → `/unauthorized`

### 8. **Troubleshooting Network Issues**
1. Buka Developer Tools → Network tab
2. Login sebagai worker
3. Periksa requests ke Firestore
4. Pastikan tidak ada 401/403 errors
5. Periksa response data untuk user document

## Expected Behavior Setelah Fix
1. Worker login → redirect ke `/worker`
2. Dashboard worker tampil dengan data personal
3. Real-time sensor monitoring (jika sensor assigned)
4. Access ke semua halaman worker: alerts, history, profile, report

## Catatan Tambahan
- Pastikan ESP32 simulator berjalan untuk testing real-time data
- Worker harus di-assign sensor oleh admin untuk melihat data real-time
- Debug component hanya muncul di development mode

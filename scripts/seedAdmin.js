/**
 * NCC SASTRA SRC — First Admin Seed Script
 *
 * Run this ONCE after creating the first admin user in Firebase Console.
 *
 * Steps:
 *  1. Go to Firebase Console → Authentication → Add user
 *     Email: admin@ncc-sastra.com  Password: (your choice)
 *  2. Copy the UID shown in the user list
 *  3. Replace ADMIN_UID below with that UID
 *  4. Run: node scripts/seedAdmin.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyD-aJbc3OsIwfF-p4dFf286rAIKTg6pYDI",
    authDomain: "ncc-sastra-src.firebaseapp.com",
    projectId: "ncc-sastra-src",
    storageBucket: "ncc-sastra-src.firebasestorage.app",
    messagingSenderId: "133145202969",
    appId: "1:133145202969:web:19f65d1ae9dc5b0b3bf588",
};

// ⬇ Replace with your admin's UID from Firebase Console
const ADMIN_UID = 'PASTE_ADMIN_UID_HERE';

async function seed() {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    await setDoc(doc(db, 'users', ADMIN_UID), {
        fullName: 'ANO Admin',
        email: 'admin@ncc-sastra.com',
        role: 'admin',
        status: 'active',
        totalPoints: 0,
        rank: 0,
        createdAt: new Date().toISOString(),
    });

    console.log('✅ Admin user document created in Firestore for UID:', ADMIN_UID);
    process.exit(0);
}

seed().catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});

// Your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyC1QdmIrSHzr6c9czsAXurO9yxuE7HSmcs",
  authDomain: "tutor-crm-48ec1.firebaseapp.com",
  projectId: "tutor-crm-48ec1",
  storageBucket: "tutor-crm-48ec1.firebasestorage.app",
  messagingSenderId: "117773349062",
  appId: "1:117773349062:web:37b02f2b64823ff84127c7",
  measurementId: "G-GQ134MRMFC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
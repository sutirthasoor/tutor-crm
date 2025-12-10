const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Firebase
const serviceAccount = require('./serviceAccountKey.json'); // ✅ This file you downloaded

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

// ========== SIMPLE API ENDPOINTS ==========

// Register user
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    // Save user data to Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      name,
      phone,
      role: role || 'tutor',
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.json({
      success: true,
      userId: userRecord.uid,
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete tutor registration
app.post('/api/tutors/register', async (req, res) => {
  try {
    const { userId, subjects, experience, location, teachingMode, expectedFees, availability } = req.body;
    
    await db.collection('tutors').doc(userId).set({
      userId,
      subjects,
      experience: parseInt(experience),
      location,
      teachingMode,
      expectedFees: parseInt(expectedFees),
      availability,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // Update user status
    await db.collection('users').doc(userId).update({
      status: 'pending'
    });

    res.json({ success: true, message: 'Tutor registration submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tutors (for admin)
app.get('/api/tutors', async (req, res) => {
  try {
    const snapshot = await db.collection('tutors').get();
    const tutors = [];
    
    snapshot.forEach(doc => {
      tutors.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, tutors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending tutors
app.get('/api/tutors/pending', async (req, res) => {
  try {
    const snapshot = await db.collection('tutors')
      .where('status', '==', 'pending')
      .get();
    
    const tutors = [];
    snapshot.forEach(doc => {
      tutors.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, tutors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update tutor status (approve/reject)
app.post('/api/tutors/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Update tutor status
    await db.collection('tutors').doc(id).update({
      status,
      updatedAt: new Date().toISOString()
    });

    // Update user status
    await db.collection('users').doc(id).update({
      status
    });

    res.json({ success: true, message: `Tutor ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const [tutorsSnapshot, studentsSnapshot, leadsSnapshot] = await Promise.all([
      db.collection('tutors').get(),
      db.collection('students').get(),
      db.collection('leads').get()
    ]);

    const pendingTutors = await db.collection('tutors')
      .where('status', '==', 'pending')
      .get();

    res.json({
      success: true,
      stats: {
        totalTutors: tutorsSnapshot.size,
        totalStudents: studentsSnapshot.size,
        totalLeads: leadsSnapshot.size,
        pendingTutors: pendingTutors.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add lead
app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, subject, source } = req.body;
    
    await db.collection('leads').add({
      name,
      phone,
      subject,
      source: source || 'website',
      status: 'new',
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Lead captured successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Firebase Backend running on http://localhost:${PORT}`);
  console.log(`📚 Admin: http://localhost:${PORT}/admin.html`);
  console.log(`👨‍🏫 Tutor Dashboard: http://localhost:${PORT}/tutor-dashboard.html`);
  console.log(`📝 Tutor Registration: http://localhost:${PORT}/tutor-register.html`);
});
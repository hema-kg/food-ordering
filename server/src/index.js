require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models/sequelize');
const initDb = require('./dbInit/init');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

(async () => {
  // Initialize database (creates DB, UDFs, sync models, seed admin) before starting server
  await initDb.initializeDatabase();
  // Ensure sequelize can connect now
  await sequelize.authenticate();
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
})();

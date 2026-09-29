const express = require('express');
const path = require('node:path');
const mongoose = require('mongoose');
const { HttpError, errorHandler } = require('./lib/errors');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));
app.get('/health', (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' });
});
app.use('/contacts', require('./lib/contact-routes'));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => next(new HttpError(404, 'NOT_FOUND', 'Route not found')));
app.use(errorHandler);
module.exports = app;

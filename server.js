require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Contact = require('./lib/contact');
const app = require('./app');
async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in .env before starting');
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'contact_management', serverSelectionTimeoutMS: 10000 });
  await Contact.init();
  const server = app.listen(port, () => console.log(`Contact Desk: http://localhost:${port}`));
  server.on('error', async err => { console.error('Server failed:', err.code); await mongoose.disconnect(); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
    const timer = setTimeout(() => process.exit(1), 10000); timer.unref();
    server.close(async () => { await mongoose.disconnect(); clearTimeout(timer); });
  });
}
main().catch(async err => { console.error('Startup failed:', err.name === 'MongooseServerSelectionError' ? 'Check MongoDB availability and MONGODB_URI' : err.message); await mongoose.disconnect(); process.exitCode = 1; });

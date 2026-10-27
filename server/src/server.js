const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`[LifeLedger Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`[LifeLedger Server] Health Check: http://localhost:${PORT}/api/health`);
      
      const { isCloudinaryConfigured } = require('./config/cloudinary');
      if (isCloudinaryConfigured()) {
        console.log('[LifeLedger Server] Cloudinary storage configured (authenticated assets enabled).');
      } else {
        console.log('[LifeLedger Server] Cloudinary not configured. Attachments fallback to local/mock mode.');
      }
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[LifeLedger Server] Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDB } = require('./config/db');
        await disconnectDB();
        console.log('[LifeLedger Server] Closed server and database connections.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    // Handle nodemon restart signal
    process.once('SIGUSR2', async () => {
      console.log('\n[LifeLedger Server] Received SIGUSR2 (nodemon restart). Closing database...');
      try {
        const { disconnectDB } = require('./config/db');
        await disconnectDB();
      } catch (_) {}
      process.kill(process.pid, 'SIGUSR2');
    });
  } catch (err) {
    console.error(`[LifeLedger Server Error] Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

startServer();

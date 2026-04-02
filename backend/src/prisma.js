import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Build connection string with optimized pool settings
// For Hostinger/shared hosting, be conservative with connection limit
const isProduction = process.env.NODE_ENV === 'production';
let connectionUrl = databaseUrl;

// Add connection pool parameters if not already present
if (!connectionUrl.includes('connection_limit')) {
  // connection_limit: max connections, idle_timeout: seconds before closing idle connections
  const poolParams = isProduction 
    ? 'connection_limit=5&idle_timeout=600' // Production: 5 connections, 10 min idle timeout
    : 'connection_limit=10&idle_timeout=900'; // Dev: 10 connections, 15 min idle timeout
  
  const connector = connectionUrl.includes('?') ? '&' : '?';
  connectionUrl += `${connector}${poolParams}`;
}

// Prevent multiple PrismaClient instances in development (singleton pattern)
const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: connectionUrl,
    },
  },
  errorFormat: 'pretty',
  log: isProduction 
    ? [{ emit: 'event', level: 'error' }]
    : [
        { emit: 'stdout', level: 'query' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
});

// Log Prisma errors in production
if (isProduction) {
  prisma.$on('error', (e) => {
    console.error('[Prisma Error]', e.message);
  });
}

if (!isProduction) {
  globalForPrisma.prisma = prisma;
  
  // Log query count in development
  prisma.$on('query', (e) => {
    if (e.duration > 500) {
      console.warn(`[Slow Query - ${e.duration}ms] ${e.query.substring(0, 100)}...`);
    }
  });
}

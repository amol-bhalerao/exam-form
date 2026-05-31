import { backfillAllMissingSequences } from '../src/services/sequence-service.js';

const result = await backfillAllMissingSequences();
console.log(`Backfill complete: ${result.updated} application(s) processed (${result.total} missing).`);

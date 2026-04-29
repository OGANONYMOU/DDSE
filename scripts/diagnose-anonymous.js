import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenvConfig({ path: path.resolve(__dirname, '../.env.local') });
dotenvConfig({ path: path.resolve(__dirname, '../.env') });
const url = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
if (!url) {
  console.error('No Convex URL defined');
  process.exit(1);
}
const client = new ConvexHttpClient(url);

(async () => {
  try {
    const user = await client.query(api.auth.getUserByAppointmentNumber, { appointmentNumber: 'ANONYMOUS' });
    console.log('USER', JSON.stringify(user, null, 2));
  } catch (err) {
    console.error(err);
  }
})();

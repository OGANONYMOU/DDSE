import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const CONVEX_URL =
  process.env.CONVEX_URL ||
  process.env.VITE_CONVEX_URL ||
  'http://127.0.0.1:8888';
const BOOTSTRAP_PASSWORD =
  process.env.DDSE_BOOTSTRAP_OWNER_PASSWORD ||
  process.env.VITE_DDSE_BOOTSTRAP_OWNER_PASSWORD ||
  process.env.BOOTSTRAP_PASSWORD ||
  process.env.VITE_BOOTSTRAP_PASSWORD;

if (!CONVEX_URL) {
  console.error("ERROR: Convex URL is not configured. Set CONVEX_URL or VITE_CONVEX_URL.");
  process.exit(1);
}

if (!BOOTSTRAP_PASSWORD) {
  console.error("ERROR: DDSE_BOOTSTRAP_OWNER_PASSWORD (or BOOTSTRAP_PASSWORD) not found in .env or .env.local.");
  console.log("\nPlease add DDSE_BOOTSTRAP_OWNER_PASSWORD to your .env.local file:");
  console.log("DDSE_BOOTSTRAP_OWNER_PASSWORD=YourSecurePassword123!");
  process.exit(1);
}

async function bootstrap() {
  console.log("Initializing Platform Owner bootstrap...");
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const userId = await client.action(api.authNode.bootstrapPlatformOwner, {
      password: BOOTSTRAP_PASSWORD,
    });
    console.log(`\nSUCCESS: Platform Owner created with ID: ${userId}`);

    const bootstrapUser = await client.query(api.auth.getUserByAppointmentNumber, {
      appointmentNumber: 'ANONYMOUS',
    });
    if (!bootstrapUser) {
      throw new Error('Bootstrap claimed success but ANONYMOUS user was not found in Convex.');
    }

    console.log('Verified ANONYMOUS user in Convex.');
    console.log('User summary:', {
      appointmentNumber: bootstrapUser.appointmentNumber,
      activeRoleCode: bootstrapUser.activeRoleCode,
      status: bootstrapUser.status,
      mfaRequired: bootstrapUser.mfaRequired,
      mfaEnrolled: bootstrapUser.mfaEnrolled,
      mustChangePassword: bootstrapUser.mustChangePassword,
      isPlatformOwner: bootstrapUser.isPlatformOwner,
    });
    console.log("\nSECURITY ACTIONS REQUIRED:");
    console.log("1. Sign in with appointment number 'ANONYMOUS' and your bootstrap password.");
    console.log("2. You will be forced to change your password immediately.");
    console.log("3. You will be required to enroll in MFA.");
    console.log("4. DELETE the BOOTSTRAP_PASSWORD from your .env file after successful login.");
  } catch (err) {
    console.error("\nBOOTSTRAP FAILED:");
    if (err?.message?.includes('Platform owner already exists.')) {
      console.log('Platform owner already exists. Attempting to reset the existing ANONYMOUS password.');
      try {
        await client.action(api.authNode.resetPlatformOwnerPassword, {
          password: BOOTSTRAP_PASSWORD,
          bootstrapSecret: BOOTSTRAP_PASSWORD,
        });
        const bootstrapUser = await client.query(api.auth.getUserByAppointmentNumber, {
          appointmentNumber: 'ANONYMOUS',
        });
        console.log('Existing ANONYMOUS platform owner password has been reset.');
        if (bootstrapUser) {
          console.log('Verified ANONYMOUS user in Convex.');
          console.log('User summary:', {
            appointmentNumber: bootstrapUser.appointmentNumber,
            activeRoleCode: bootstrapUser.activeRoleCode,
            status: bootstrapUser.status,
            mfaRequired: bootstrapUser.mfaRequired,
            mfaEnrolled: bootstrapUser.mfaEnrolled,
            mustChangePassword: bootstrapUser.mustChangePassword,
            isPlatformOwner: bootstrapUser.isPlatformOwner,
          });
        }
        console.log("Appointment Number: ANONYMOUS");
        console.log("Please sign in with your bootstrap password and complete first-login setup.");
        process.exit(0);
      } catch (resetErr) {
        console.error('Password reset failed:');
        console.error(resetErr.message);
        process.exit(1);
      }
    }
    console.error(err.message);
    process.exit(1);
  }
}

bootstrap();

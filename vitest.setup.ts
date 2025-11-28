import { config } from "dotenv";

config({ path: ".env", override: false });

if (!process.env.PORT) {
  process.env.PORT = "3001";
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret";
}

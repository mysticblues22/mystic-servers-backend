import {
  hashPassword,
  verifyPassword,
} from "./src/index.js";

const password = "Mystic123!";

const hash = await hashPassword(password);

console.log("Hash:", hash);

const ok = await verifyPassword(password, hash);

console.log("Verified:", ok);

import {
  createAccessToken,
  verifyAccessToken,
} from "../src/index.js";

const token = await createAccessToken({
  userId: "1",
  email: "admin@mystic.local",
  role: "admin",
});

console.log("========== TOKEN ==========");
console.log(token);

const payload = await verifyAccessToken(token);

console.log();
console.log("========== PAYLOAD ==========");
console.log(payload);

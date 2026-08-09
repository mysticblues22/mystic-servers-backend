import { createServer } from "./src/index.js";

const app = await createServer();

console.log("✅ Server created");

await app.close();

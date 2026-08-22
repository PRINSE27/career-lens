// Vercel serverless entry point.
// @vercel/node compiles TypeScript natively.
// This re-exports the Express app for Vercel to invoke as a serverless function.
import app from "../src/server.js";
export default app;

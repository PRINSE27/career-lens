// Vercel serverless entry point.
// Re-exports the compiled Express app so Vercel can invoke it
// as a serverless function.
export { default } from "../dist/server.js";

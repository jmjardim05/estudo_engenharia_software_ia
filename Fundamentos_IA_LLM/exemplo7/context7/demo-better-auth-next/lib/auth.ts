import Database from "better-sqlite3";
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: new Database("./better-auth.sqlite"),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "demo-github-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "demo-github-client-secret",
    },
  },
  trustedOrigins: ["http://localhost:3000"],
});

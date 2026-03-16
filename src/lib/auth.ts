import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const adminEmail = process.env.ADMIN_EMAIL ?? "";
const adminPassword = process.env.ADMIN_PASSWORD ?? "";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const isValid =
          credentials.email === adminEmail &&
          credentials.password === adminPassword;

        if (!isValid) {
          return null;
        }

        return {
          id: "admin",
          name: "Admin",
          email: adminEmail,
        };
      },
    }),
  ],
};

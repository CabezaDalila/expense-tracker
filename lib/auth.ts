import { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { neon } from "@neondatabase/serverless"
import { initializeDatabase } from "@/lib/init-database"

const sql = neon(process.env.DATABASE_URL!)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return false
      try {
        await initializeDatabase()
        await sql`
          INSERT INTO app_users (id, email, name, image)
          VALUES (${user.id}, ${user.email}, ${user.name}, ${user.image})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.name,
            image = EXCLUDED.image
        `
        return true
      } catch (e) {
        console.error("Error en signIn:", e)
        return false
      }
    },
    async jwt({ token }) {
      if (!token.sub) return token
      try {
        const [member] = await sql`
          SELECT hm.household_id, h.name as household_name
          FROM household_members hm
          JOIN households h ON h.id = hm.household_id
          WHERE hm.user_id = ${token.sub}
          LIMIT 1
        `
        token.householdId = member?.household_id ?? null
        token.householdName = member?.household_name ?? null
      } catch {
        token.householdId = null
        token.householdName = null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.householdId = token.householdId ?? null
        session.user.householdName = token.householdName ?? null
      }
      return session
    },
  },
}

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/utils/prisma";

export const {
  handlers,
  signIn,
  signOut,
  auth
} = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  debug: true,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID as string,
      clientSecret: process.env.AUTH_GITHUB_SECRET as string,
    })
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role;
        session.user.status = (user as any).status;
      }
      return session;
    }
  },
  events: {
    createUser: async ({ user }) => {
      console.log("create")
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      console.log("create end")

      if (adminCount === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "ADMIN"
          },
        });
      }
    },
  },
  secret: process.env.AUTH_SECRET
});
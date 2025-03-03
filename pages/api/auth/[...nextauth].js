import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { loginUser } from '../../../lib/auth';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: 'Số điện thoại', type: 'text' },
        password: { label: 'Mật khẩu', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const result = await loginUser({
            phone: credentials.phone,
            password: credentials.password
          });
          
          return result.user;
        } catch (error) {
          console.error('NextAuth error:', error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || 'our-super-secret-jwt-key-for-qlkho',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
});

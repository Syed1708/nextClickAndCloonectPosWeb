import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    userType?: 'client' | 'staff';
    role?: string;
    user: {
      id?: string;
      phone?: string;
      address?: string;
      userType?: 'client' | 'staff';
      role?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    accessToken?: string;
    userType?: 'client' | 'staff';
    role?: string;
    phone?: string;
  }
}
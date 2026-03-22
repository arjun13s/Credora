import bcrypt from 'bcryptjs';

export type UserRole = 'applicant' | 'reviewer';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  name: string;
}

// Hardcode passwords as 'password' for demo purposes
const DEMO_PASSWORD_HASH = bcrypt.hashSync('password', 10);

export const users: User[] = [
  {
    id: 'user_1',
    email: 'applicant@credora.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'applicant',
    name: 'Demo Applicant',
  },
  {
    id: 'user_2',
    email: 'reviewer@credora.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'reviewer',
    name: 'Demo Reviewer',
  },
];

export async function getUser(email: string): Promise<User | undefined> {
  return users.find((user) => user.email === email);
}

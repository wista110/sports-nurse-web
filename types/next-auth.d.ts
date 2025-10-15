import { UserRole } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { UserProfile } from "./domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      profile: UserProfile;
      createdAt?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    profile?: UserProfile;
    createdAt?: Date;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    profile?: UserProfile;
    createdAt?: string;
  }
}
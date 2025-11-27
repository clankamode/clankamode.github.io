/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }

    proxy?: {
      email: string | null
      name?: string | null
      image?: string | null
      role: string | null
    } | null

    originalUser?: {
      email?: string | null
      name?: string | null
      image?: string | null
      role: string
    }

    isProxying?: boolean
  }

  interface User {
    id: string
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    email?: string | null
    name?: string | null
    image?: string | null
    proxyEmail?: string | null
    proxyName?: string | null
    proxyImage?: string | null
    proxyRole?: string | null
    originalEmail?: string | null
    originalName?: string | null
    originalImage?: string | null
    originalRole?: string | null
  }
}
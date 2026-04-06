import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        studentId: { label: '学号/工号', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.studentId || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { studentId: credentials.studentId as string },
          include: {
            permissions: {
              select: { permission: true },
            },
          },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isValid) return null

        // 老师拥有所有权限
        const permissions = user.role === 'TEACHER'
          ? ['MANAGE_REGISTRATIONS', 'MANAGE_TEAMS', 'MANAGE_STAFF', 'MANAGE_SCHEDULE', 'MANAGE_ANNOUNCEMENTS', 'MANAGE_SCORES', 'MANAGE_MATERIALS', 'MANAGE_ROTATION', 'MANAGE_TREASURE', 'VIEW_FEEDBACKS', 'MANAGE_SETTINGS', 'VIEW_LOGS', 'EXPORT_DATA', 'MANAGE_ADMINS']
          : user.permissions.map((p) => p.permission)

        return {
          id: user.id,
          name: user.name,
          studentId: user.studentId,
          role: user.role,
          grade: user.grade,
          className: user.className,
          isFirstLogin: user.isFirstLogin,
          permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.studentId = user.studentId
        token.grade = user.grade
        token.className = user.className
        token.isFirstLogin = user.isFirstLogin
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).studentId = token.studentId
        ;(session.user as any).grade = token.grade
        ;(session.user as any).className = token.className
        ;(session.user as any).isFirstLogin = token.isFirstLogin
        ;(session.user as any).permissions = token.permissions
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})

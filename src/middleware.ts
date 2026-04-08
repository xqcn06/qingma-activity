import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// 公开路由（无需登录）
const publicRoutes = [
  '/',
  '/info',
  '/schedule',
  '/activities',
  '/ranking',
  '/announcements',
  '/contact',
  '/emergency',
  '/gallery',
  '/login',
  '/register',
  '/change-password',
]

// API 公开路由
const publicApiRoutes = [
  '/api/auth',
]

// 学生路由（需登录，学生角色）
const studentRoutes = [
  '/groups',
  '/checkin',
  '/feedback',
  '/my-team',
  '/staff',
  '/treasure-map',
]

// 后台路由（需登录，ADMIN/TEACHER/STAFF）
const adminRoutes = [
  '/admin',
]

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  // API 公开路由直接放行
  for (const route of publicApiRoutes) {
    if (pathname.startsWith(route)) {
      return NextResponse.next()
    }
  }

  // 公开路由直接放行
  if (publicRoutes.includes(pathname)) {
    const session = await auth()
    // 如果已登录且访问登录页，重定向到对应首页
    if (session && pathname === '/login') {
      const role = (session.user as any)?.role
      if (role === 'ADMIN' || role === 'TEACHER' || role === 'STAFF') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // 需要登录的路由
  const requiresAuth = [...studentRoutes, ...adminRoutes].some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (requiresAuth) {
    const session = await auth()

    if (!session) {
      // 未登录，重定向到登录页
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = (session.user as any)?.role
    const isFirstLogin = (session.user as any)?.isFirstLogin

    // 首次登录且不是访问修改密码页，强制跳转
    if (isFirstLogin && pathname !== '/change-password') {
      return NextResponse.redirect(new URL('/change-password', req.url))
    }

    // 后台路由：只允许 ADMIN/TEACHER/STAFF 访问
    const isAdminRoute = adminRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + '/')
    )
    if (isAdminRoute && role === 'STUDENT') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

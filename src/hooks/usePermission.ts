"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

/**
 * 前端权限检查 Hook
 * 注意：这只是基于 session 中缓存的权限数据，真正的权限检查在后端 API 中进行
 */
export function usePermission() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const permissions = (session?.user as any)?.permissions || [];

  const hasPermission = (permission: string) => {
    if (role === "TEACHER") return true;
    return permissions.includes(permission);
  };

  const hasAnyPermission = (perms: string[]) => {
    if (role === "TEACHER") return true;
    return perms.some((p) => permissions.includes(p));
  };

  const isAdmin = role === "ADMIN" || role === "TEACHER";
  const isTeacher = role === "TEACHER";
  const isStaff = role === "STAFF";
  const isStudent = role === "STUDENT";

  return useMemo(
    () => ({
      role,
      permissions,
      hasPermission,
      hasAnyPermission,
      isAdmin,
      isTeacher,
      isStaff,
      isStudent,
    }),
    [role, permissions]
  );
}

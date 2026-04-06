import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAndValidateStudents } from "@/lib/excel-parser";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 解析和验证 Excel
    const result = parseAndValidateStudents(buffer);

    // 如果是预览模式，只返回结果不导入
    const isPreview = formData.get("preview") === "true";
    if (isPreview) {
      return NextResponse.json({
        totalRows: result.totalRows,
        successRows: result.successRows,
        failedRows: result.failedRows,
      });
    }

    // 创建导入批次记录
    const userId = (session.user as any).id as string;

    const batch = await prisma.importBatch.create({
      data: {
        fileName: file.name,
        totalRows: result.totalRows,
        successRows: 0,
        failedRows: result.failedRows.length,
        importedBy: userId,
      },
    });

    const hashedPassword = await bcrypt.hash("123456", 10);
    let importedCount = 0;

    // 批量导入成功行
    for (const row of result.successRows) {
      try {
        // 检查学号是否已存在
        const existing = await prisma.user.findUnique({
          where: { studentId: row.studentId },
        });

        if (existing) {
          await prisma.importLog.create({
            data: {
              batchId: batch.id,
              rowNumber: row.rowNumber,
              name: row.name,
              studentId: row.studentId,
              className: row.className,
              position: row.rawPosition,
              status: "FAILED",
              errorMsg: "学号已存在",
            },
          });
          continue;
        }

        // 创建用户
        await prisma.user.create({
          data: {
            name: row.name,
            studentId: row.studentId,
            grade: row.grade,
            className: row.className,
            role: "STUDENT",
            phone: row.phone || "",
            password: hashedPassword,
            isFirstLogin: true,
          },
        });

        await prisma.importLog.create({
          data: {
            batchId: batch.id,
            rowNumber: row.rowNumber,
            name: row.name,
            studentId: row.studentId,
            className: row.className,
            position: row.rawPosition,
            status: "SUCCESS",
          },
        });

        importedCount++;
      } catch (e: any) {
        await prisma.importLog.create({
          data: {
            batchId: batch.id,
            rowNumber: row.rowNumber,
            name: row.name,
            studentId: row.studentId,
            className: row.className,
            position: row.rawPosition,
            status: "FAILED",
            errorMsg: e.message || "导入失败",
          },
        });
      }
    }

    // 记录失败行
    for (const row of result.failedRows) {
      await prisma.importLog.create({
        data: {
          batchId: batch.id,
          rowNumber: row.rowNumber,
          name: row.name,
          studentId: row.studentId,
          className: row.className,
          position: row.position,
          status: "FAILED",
          errorMsg: row.error,
        },
      });
    }

    // 更新批次统计
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        successRows: importedCount,
        failedRows: result.failedRows.length + (result.successRows.length - importedCount),
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRows: result.totalRows,
      successRows: importedCount,
      failedRows: result.failedRows.length + (result.successRows.length - importedCount),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "导入失败" }, { status: 500 });
  }
}

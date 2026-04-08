import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const gameStation = searchParams.get("gameStation");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const where: any = {};
    if (gameStation) where.gameStation = gameStation;
    if (category) where.category = category;
    if (status) where.status = status;

    const materials = await prisma.material.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(materials);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { name, category, gameStation, quantity, unit, unitPrice, allocatedTo, session: matSession, status, description } = body;

    if (!name || quantity === undefined) {
      return NextResponse.json({ error: "缺少必填参数" }, { status: 400 });
    }

    const totalPrice = unitPrice && quantity ? unitPrice * quantity : null;

    const newMaterial = await prisma.material.create({
      data: {
        name,
        category: category || null,
        gameStation: gameStation || null,
        quantity,
        unit: unit || null,
        unitPrice: unitPrice || null,
        totalPrice,
        allocatedTo: allocatedTo || null,
        session: matSession || null,
        status: status || "PENDING",
        description: description || null,
      },
    });

    return NextResponse.json(newMaterial);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "创建失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, name, category, gameStation, quantity, unit, unitPrice, allocatedTo, session: matSession, status, description } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "物资不存在" }, { status: 404 });
    }

    const finalQuantity = quantity !== undefined ? quantity : existing.quantity;
    const finalUnitPrice = unitPrice !== undefined ? unitPrice : existing.unitPrice;
    const totalPrice = finalUnitPrice && finalQuantity ? finalUnitPrice * finalQuantity : null;

    const updated = await prisma.material.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        category: category !== undefined ? category : undefined,
        gameStation: gameStation !== undefined ? gameStation : undefined,
        quantity: quantity !== undefined ? quantity : undefined,
        unit: unit !== undefined ? unit : undefined,
        unitPrice: unitPrice !== undefined ? unitPrice : undefined,
        totalPrice,
        allocatedTo: allocatedTo !== undefined ? allocatedTo : undefined,
        session: matSession !== undefined ? matSession : undefined,
        status: status !== undefined ? status : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    const existing = await prisma.material.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "物资不存在" }, { status: 404 });
    }

    await prisma.material.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "删除失败" }, { status: 500 });
  }
}

import { Router } from "express";
import { db } from "@workspace/db";
import { villagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateVillageBody,
  DeleteVillageParams,
  GetVillageParams,
  UpdateVillageBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/villages", async (req, res) => {
  const villages = await db.select().from(villagesTable).orderBy(villagesTable.nameEl);
  res.json(villages.map(formatVillage));
});

router.post("/villages", async (req, res) => {
  const body = CreateVillageBody.parse(req.body);
  const [village] = await db.insert(villagesTable).values({
    name: body.name,
    nameEl: body.nameEl,
    description: body.description,
    population: body.population ?? null,
    elevation: body.elevation ?? null,
    imageUrl: body.imageUrl ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
  }).returning();
  res.status(201).json(formatVillage(village));
});

router.patch("/villages/:id", async (req, res) => {
  const { id } = GetVillageParams.parse({ id: Number(req.params.id) });
  const body = UpdateVillageBody.parse(req.body);
  const [existing] = await db.select().from(villagesTable).where(eq(villagesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [updated] = await db.update(villagesTable).set({
    ...(body.name !== undefined && { name: body.name }),
    ...(body.nameEl !== undefined && { nameEl: body.nameEl }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.population !== undefined && { population: body.population }),
    ...(body.elevation !== undefined && { elevation: body.elevation }),
    ...("imageUrl" in body && { imageUrl: body.imageUrl ?? null }),
    ...(body.latitude !== undefined && { latitude: body.latitude }),
    ...(body.longitude !== undefined && { longitude: body.longitude }),
  }).where(eq(villagesTable.id, id)).returning();
  res.json(formatVillage(updated));
});

router.delete("/villages/:id", async (req, res) => {
  const { id } = DeleteVillageParams.parse({ id: Number(req.params.id) });
  const [existing] = await db.select().from(villagesTable).where(eq(villagesTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await db.delete(villagesTable).where(eq(villagesTable.id, id));
  res.status(204).end();
});

router.get("/villages/:id", async (req, res) => {
  const { id } = GetVillageParams.parse({ id: Number(req.params.id) });
  const [village] = await db.select().from(villagesTable).where(eq(villagesTable.id, id));
  if (!village) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(formatVillage(village));
});

function formatVillage(v: typeof villagesTable.$inferSelect) {
  return {
    id: v.id,
    name: v.name,
    nameEl: v.nameEl,
    description: v.description,
    municipalUnit: v.municipalUnit,
    population: v.population,
    elevation: v.elevation,
    imageUrl: v.imageUrl,
    latitude: v.latitude,
    longitude: v.longitude,
    createdAt: v.createdAt.toISOString(),
  };
}

export default router;

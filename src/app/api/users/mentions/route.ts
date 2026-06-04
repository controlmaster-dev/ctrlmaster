import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { UserModel } from "@/models";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => {
  await connectMongo();
  const users = await UserModel.find()
    .select("name image")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json(
    users.map((u) => ({
      id: String(u._id),
      name: u.name,
      image: u.image,
    })),
    { headers: { "Cache-Control": "private, max-age=300" } }
  );
});

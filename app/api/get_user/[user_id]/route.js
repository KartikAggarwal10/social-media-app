import { connectDB } from "../../../../lib/mongodb";

export async function GET(request, { params }) {
  const db = await connectDB();
  const { user_id } = await params;
  
  const user = await db.collection("users").findOne({
    $or: [{ userId: user_id }, { userId: Number(user_id) }]
  });
  
  return Response.json({ dt: user, posts: user?.posts || [] });
}
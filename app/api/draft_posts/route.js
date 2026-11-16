import { connectDB } from "../../../lib/mongodb";
export async function POST(req){
    const {postId, content, title, category, tags, cover} = await req.json()
    const db = await connectDB();

  await db.collection("posts").updateOne(
    { $or: [{ postId: postId }, { postId: Number(postId) }] },
    {
      $set: {
        content,
        title,
        category,
        cover,
        tags,
      },
    }
  );

  return { success: true };
}


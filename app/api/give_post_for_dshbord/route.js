import { connectDB } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/require-user";

export async function GET(request, { params }) {
  try {
    const db = await connectDB();
  const user_data = await requireUser();
  const userId = user_data.id
    console.log("route." + userId)
    const user_posts = await db
      .collection("users")
      .findOne({
        $or: [{ userId: userId }, { userId: Number(userId) }]
      })
    const posts = await db.collection("posts").find({postId : {$in : user_posts.posts}}).toArray()
    for(let post in posts) console.log(post)
    return Response.json({ dt: posts || [] });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return Response.json({ dt: [], error: error.message }, { status: 500 });
  }
}

import CreatePost from "../../../components/create_posts/CreatePost";
import { connectDB } from "../../../lib/mongodb";
export default async function CreatePostPage({ params }) {
  const { postId } = await params;
  const db = await connectDB();
  // Fetch initial post data directly on server
  const post = await db.collection("posts").findOne({
    $or: [{ postId: postId }, { postId: Number(postId) }]
  });
  const plainPost = post
  ? {
      ...post,
      // ObjectId → string
      _id: post._id?.toString(),
      // Dates → ISO strings (or numbers)
      createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
      // If you have other nested objects that contain ObjectId/Date, do the same
    }
  : { postId };
return <CreatePost data={plainPost} />;
}

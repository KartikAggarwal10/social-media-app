import { connectDB } from "../../../lib/mongodb"; 
const DEFAULT_BLOG_COVERS = {
  technology:
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",

  programming:
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",

  ai:
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",

  business:
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80",

  finance:
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&q=80",

  startup:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",

  education:
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",

  science:
    "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=1200&q=80",

  health:
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80",

  fitness:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",

  travel:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",

  food:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",

  lifestyle:
    "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",

  sports:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80",

  entertainment:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80",

  gaming:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",

  photography:
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",

  fashion:
    "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80",

  history:
    "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=1200&q=80",

  nature:
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",

  default:
    "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200&q=80",
};
export async function POST(req) {
  const db = await connectDB();
  const { postId } = await req.json();
  const post = await db.collection("posts").findOne({
    $or: [{ postId: postId }, { PostId: postId }, { postId: Number(postId) }]
  });
  if (!post) {
    return Response.json({ error: "Post not found" }, { status: 404 });
  }
  let finalCover = post.cover;
  if (!finalCover || finalCover.trim() === "") {
    const cat = (post.category || post.categories || "").toLowerCase().trim();
    finalCover = DEFAULT_BLOG_COVERS[cat] || DEFAULT_BLOG_COVERS["default"];
  }
  await db.collection("posts").updateOne(
    { $or: [{ postId: postId }, { PostId: postId }, { postId: Number(postId) }] },
    {
      $set: {
        cover: finalCover,
        status: "published",
        likes: post.likes || 0,
        comments: post.comments || [],
        publishedAt: new Date(),
      }
    }
  );
  return Response.json({ success: true, cover: finalCover });
}
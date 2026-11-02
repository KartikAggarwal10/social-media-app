"use server";

import { connectDB } from "../../lib/mongodb";
import { revalidatePath } from "next/cache";
import { requireUser } from "../../lib/require-user";

// ─── DEFAULT COVER IMAGES BY CATEGORY ──────────────────────────────────────────
const DEFAULT_BLOG_COVERS = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
  programming: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80",
  ai: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
  business: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80",
  finance: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&q=80",
  startup: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
  education: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80",
  science: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=1200&q=80",
  health: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&q=80",
  fitness: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
  travel: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  lifestyle: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&q=80",
  sports: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&q=80",
  entertainment: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80",
  photography: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80",
  fashion: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&q=80",
  history: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=1200&q=80",
  nature: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
  default: "https://images.unsplash.com/photo-1503264116251-35a269479413?w=1200&q=80",
};

// ─── CREATE POST ─────────────────────────────────────────────────────────────
// Replaces: app/api/create_posts/route.js
export async function createPostAction(title) {
  const user_data = await requireUser();
  const adminId = user_data.id
  const db = await connectDB();
  const postCount = await db.collection("posts").countDocuments();
  const date = new Date();

  await db.collection("posts").insertOne({
    userId: adminId,
    title,
    createdAt: date,
    postId: postCount,
    status: "draft",
    content: "",
    categories: "",
    tags: [],
    cover: "",
  });

  await db.collection("users").updateOne(
    { userId: adminId },
    { $push: { posts: postCount } }
  );

  revalidatePath("/");
  return { postId: postCount };
}

// ─── SAVE DRAFT ──────────────────────────────────────────────────────────────
// Replaces: app/api/draft_posts/route.js
// Bug fix: original used {PostId: postId} but data is stored as {postId: ...}
export async function saveDraftAction({ postId, content, title, category, tags, cover }) {
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

// ─── PUBLISH POST ────────────────────────────────────────────────────────────
// Replaces: app/api/publish_posts/route.js
export async function publishPostAction({ postId, content, title, category, tags, cover }) {
  const db = await connectDB();
  await saveDraftAction({ postId, content, title, category, tags, cover });
  const post = await db.collection("posts").findOne({
    $or: [{ postId: postId }, { PostId: postId }, { postId: Number(postId) }],
  });

  if (!post) {
    console.log("post not found")
    throw new Error("Post not found");
  }

  let finalCover = post.cover;
  if (!finalCover || finalCover.trim() === "") {
    const cat = (post.category || post.categories || "").toLowerCase().trim();
    finalCover = DEFAULT_BLOG_COVERS[cat] || DEFAULT_BLOG_COVERS["default"];
  }
  
    console.log("post to save.")
  await db.collection("posts").updateOne(
    { $or: [{ postId: postId }, { PostId: postId }, { postId: Number(postId) }] },
    {
      $set: {
        cover: finalCover,
        status: "published",
        likes: post.likes || 0,
        comments: post.comments || [],
        publishedAt: new Date(),
      },
    }
  );
  console.log("post saved");
  revalidatePath("/");
  return { success: true, cover: finalCover };
}

// ─── TOGGLE LIKE ─────────────────────────────────────────────────────────────
// Replaces: app/api/like/route.js
// Bug fix: original used $dec which doesn't exist in MongoDB — using $inc with -1
export async function toggleLikeAction(postId,  isLiked) {
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();

  if (!isLiked) {
    // Like the post
    await db.collection("posts").updateOne(
      { $or: [{ postId: postId }, { PostId: postId }] },
      { $inc: { likes: 1 } }
    );
    await db.collection("users").updateOne(
      { userId: userId },
      { $push: { likes: postId } }
    );
  } else {
    // Unlike the post
    await db.collection("posts").updateOne(
      { $or: [{ postId: postId }, { PostId: postId }] },
      { $inc: { likes: -1 } }
    );
    await db.collection("users").updateOne(
      { userId: userId },
      { $pull: { likes: postId } }
    );
  }

  revalidatePath("/");
  return { success: true };
}

// ─── ADD COMMENT ─────────────────────────────────────────────────────────────
// Replaces: app/api/comments/route.js (x == 0 case)
export async function addCommentAction(postId,  comment) {
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();

  await db.collection("posts").updateOne(
    { $or: [{ postId: postId }, { PostId: postId }] },
    { $push: { comments: { comment, user: userId } } }
  );
  await db.collection("users").updateOne(
    { userId: userId },
    { $push: { comments: { comment, post: postId } } }
  );

  revalidatePath("/");
  return { success: true };
}

// ─── DELETE COMMENT ──────────────────────────────────────────────────────────
// Replaces: app/api/comments/route.js (x == 1 case)
export async function deleteCommentAction(postId, comment) {
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();

  await db.collection("posts").updateOne(
    { $or: [{ postId: postId }, { PostId: postId }] },
    { $pull: { comments: { comment, user: userId } } }
  );
  await db.collection("users").updateOne(
    { userId: userId },
    { $pull: { comments: { comment, post: postId } } }
  );

  revalidatePath("/");
  return { success: true };
}

// check if user has liked the post

export async function checkUserLikedAction(postId){
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();
  const x = await db.collection("users").findOne({userId:userId})
  const likes = x.likes
  if(likes.includes(postId)) {
    return true
  }
  return false;
}

export async function getAllCommentsAction(postId){
  
  const db = await connectDB();
  const dt = await db.collection("posts").findOne({postId : postId});
  return dt.comments
}
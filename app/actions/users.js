"use server";

import { connectDB } from "../../lib/mongodb";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { requireUser } from "../../lib/require-user";
// ─── ADD USER (REGISTER) ────────────────────────────────────────────────────
// Replaces: app/api/add_user/route.js
// Bug fix: original was missing `await` on countDocuments() and had no return
export async function addUserAction(userName, email, password) {
  const db = await connectDB();
  const userCount = await db.collection("users").countDocuments();
  const hashed_password =await bcrypt.hash(password,15)
  await db.collection("users").insertOne({
    userId: userCount,
    userName,
    email,
    password :hashed_password,
    bio:"",
    posts: [],
    dp: "/user.png",
    likes: [],
    comments: [],
    followed: [],
    followers: [],
    request_sent: [],
    request_came: [],
    bookmarks:[],
    chats:[]
  });

  return { success: true, userId: userCount };
}
export async function getDp(userId) {
  const db = await connectDB();

  const dp = await db
    .collection("users")
    .findOne(
      { userId: userId },
      { projection: { dp: 1, _id: 0 } }
    );

  return dp?.dp || null;
}
export async function changeDp(id) {
  const user = await requireUser()
  const userId = user.id
  const db = await connectDB();
  await db.collection("users").updateOne({userId:userId},{$set:{dp : id}})
}
export async function updateBioAction(userId,bio){
  const db = await connectDB();
  await db.collection("users").updateOne({userId:userId},{$set:{bio:bio}})
}

// ─── SEND FOLLOW REQUEST ────────────────────────────────────────────────────
// Replaces: app/api/follow_request/route.js POST
export async function sendFollowRequestAction(adminId) {
  
  const user = await requireUser()
  const userId = user.id
  const db = await connectDB();

  await db.collection("users").updateOne(
    { userId: userId },
    { $push: { request_sent: adminId } }
  );
  await db.collection("users").updateOne(
    { userId: adminId },
    { $push: { request_came: userId } }
  );

  revalidatePath("/");
  return { success: true };
}

export async function takeBackFollowRequestAction(adminId) {
  
  const user = await requireUser()
  const userId = user.id
  const db = await connectDB();

  await db.collection("users").updateOne(
    { userId: userId },
    { $pull: { request_sent: adminId } }
  );
  await db.collection("users").updateOne(
    { userId: adminId },
    { $pull: { request_came: userId } }
  );

  revalidatePath("/");
  return { success: true };
}

export async function getUser(userId) {
  const db = await connectDB();
  const numericId = !isNaN(Number(userId)) ? Number(userId) : userId;
  const x = await db.collection("users").findOne(
    { $or: [{ userId: numericId }, { userId: String(userId) }] },
    { projection: { request_sent: 0, request_came: 0, chats: 0 } }
  );
  if (!x) return null;
  return { ...x, _id: x._id?.toString() };
}
// ─── CANCEL FOLLOW REQUEST / UNFOLLOW ───────────────────────────────────────
// Replaces: app/api/follow_request/route.js DELETE
// type: "request" to cancel a pending request, "unfollow" to unfollow
// export async function loginthroughemail(email, password) {
//   const db = await connectDB();
//   const x = await db.collection("users").findOne({ email: email });
  
//   if (!x || !x.password || !bcrypt.compare(password,x.password)) {
//     return { result: null, error: "Invalid credentials" };
//   }
//   return { result: x.userId, userName: x.userName };
// }

export async function loginthroughAuth(email, userName) {
  const db = await connectDB();
  const x = await db.collection("users").findOne({ email: email });
  if (!x) {
    const finalUserName = userName || (email ? email.split("@")[0] : "User");
    const res = await addUserAction(finalUserName, email, "");
    return { result: res.userId, userName: finalUserName };
  }
  return { result: x.userId, userName: x.userName };
}
export async function cancelFollowAction(adminId, userId, type) {
  const targetId = Number(adminId);
  const currentUserId = userId === undefined ? (await requireUser()).id : Number(userId);
  if (!Number.isInteger(targetId) || !Number.isInteger(Number(currentUserId))) {
    throw new Error("Invalid user ID");
  }
  const db = await connectDB();

  if (type === "request") {
    const senderResult = await db.collection("users").updateOne(
      { userId: currentUserId },
      { $pull: { request_sent: targetId } }
    );
    const recipientResult = await db.collection("users").updateOne(
      { userId: targetId },
      { $pull: { request_came: currentUserId } }
    );
    if (senderResult.matchedCount !== 1 || recipientResult.matchedCount !== 1) {
      throw new Error("Follow request users were not found");
    }
  } else {
    // type === "unfollow"
    await db.collection("users").updateOne(
      { userId: currentUserId },
      { $pull: { followed: targetId } }
    );
    await db.collection("users").updateOne(
      { userId: targetId },
      { $pull: { followers: currentUserId } }
    );
  }

  revalidatePath("/");
  return { success: true };
}

// ─── ACCEPT FOLLOW REQUEST ──────────────────────────────────────────────────
// Replaces: app/api/follow_accept/route.js
export async function acceptFollowAction(adminId) {
  const user = await requireUser();
  const userId = Number(user.id);
  const senderId = Number(adminId);
  if (!Number.isInteger(userId) || !Number.isInteger(senderId)) {
    throw new Error("Invalid user ID");
  }
  const db = await connectDB();

  const recipientResult = await db.collection("users").updateOne(
    { userId },
    { $pull: { request_came: senderId }, $addToSet: { followers: senderId } }
  );
  const senderResult = await db.collection("users").updateOne(
    { userId: senderId },
    { $pull: { request_sent: userId }, $addToSet: { followed: userId } }
  );

  if (recipientResult.matchedCount !== 1 || senderResult.matchedCount !== 1) {
    throw new Error("Follow request users were not found");
  }
  revalidatePath("/");
  return { success: true };
}

export async function checkFollowStatusAction(postId) {
  const user = await requireUser();
  const userId = user.id;
  const db = await connectDB();

  const post = await db.collection("posts").findOne({
    $or: [{ postId: postId }, { PostId: postId }]
  });

  // Handle case where post is not found
  if (!post || !post.userId) {
    return { status: "not_followed" };
  }

  const adminId = post.userId;

  const x = await db.collection("users").findOne({ userId: userId });

  // Fallback to empty arrays if user document or fields are missing/undefined
  const request_sent = x?.request_sent || [];
  const followed = x?.followed || [];

  if (followed.includes(adminId)) {
    return { status: "followed" };
  }
}
export async function addbookmarkaction(postId){
  const user = await requireUser()
  const userId = user.id
  const db = await connectDB();
  await db.collection("users").updateOne({userId:userId},{$push:{bookmarks:postId}})
  return {success : true}
}

export async function isbookmarked(postId) {
  const user_data = await requireUser();
  const userId = user_data.id;
  const db = await connectDB();
  const numericId = !isNaN(Number(userId)) ? Number(userId) : userId;
  const user = await db.collection("users").findOne({
    $or: [{ userId: numericId }, { userId: String(userId) }]
  });
  if (!user || !user.bookmarks) {
    return { status: false };
  }
  const bookmarks = user.bookmarks;
  if (bookmarks.includes(postId)) {
    return { status: true };
  }
  return { status: false };
}

export async function removebookmarkaction(postId){
  const user = await requireUser()
  const userId = user.id
  const db = await connectDB();
  await db.collection("users").updateOne({userId:userId},{$pull:{bookmarks:postId}})
  return {success : true}
}

// ─── GET USER'S COMMENTS (OPTIMIZED) ───
export async function getUserCommentsAction() {
  const user_data = await requireUser()
  const userId = user_data.id
  const db = await connectDB();
  const numericId = !isNaN(Number(userId)) ? Number(userId) : userId;
  const user = await db.collection("users").findOne({
    $or: [{ userId: numericId }, { userId: String(userId) }]
  });
  
  if (!user || !user.comments || user.comments.length === 0) {
    return [];
  }

  // Extract just the post IDs the user commented on
  const postIds = user.comments.map(c => c.post);

  // Fetch ALL those posts in one single database call using $in
  const posts = await db.collection("posts")
    .find({ postId: { $in: postIds } })
    .toArray();

  // Combine the post data with the user's specific comment text
  const commentsWithPosts = user.comments.map(userComment => {
    const matchedPost = posts.find(p => p.postId === userComment.post);
    return {
      post: matchedPost ? { ...matchedPost, _id: matchedPost._id?.toString() } : null,
      comment: userComment.comment
    };
  });

  return commentsWithPosts;
}


// ─── GET USER'S BOOKMARKS (OPTIMIZED) ───
export async function getUserBookmarksAction() {
  const user_data = await requireUser()
  const userId = user_data.id
  const db = await connectDB();
  const numericId = !isNaN(Number(userId)) ? Number(userId) : userId;
  const user = await db.collection("users").findOne({
    $or: [{ userId: numericId }, { userId: String(userId) }]
  });
  
  if (!user || !user.bookmarks || user.bookmarks.length === 0) {
    return [];
  }

  // Fetch ALL bookmarked posts in one single database call using $in
  const bookmarkedPosts = await db.collection("posts")
    .find({ postId: { $in: user.bookmarks } })
    .toArray();

  return bookmarkedPosts.map(p => ({ ...p, _id: p._id?.toString() }));
}

export async function StorechatAction(receiverId,msg) {
  const user_data = await requireUser()
  const senderId = user_data.id
  const normalizedReceiverId = Number(receiverId);
  if (!Number.isInteger(normalizedReceiverId)) {
    throw new Error("Invalid receiver ID");
  }
  const db = await connectDB();
  const messageId = new ObjectId();
  
  const x = await db.collection("users").findOne({userId : senderId , "chats.friend" : normalizedReceiverId});
  if(!x) {
    const senderResult = await db.collection("users").updateOne(
      { userId:senderId },
      {
        $push: {
          chats: {
            friend: normalizedReceiverId,
            messages: [
              {
                _id : messageId,
                type: "sent",
                message: msg
              }
            ]
          }
        }
      }
    );
    if (senderResult.matchedCount !== 1) {
      throw new Error("Sender user was not found");
    }
  }
  else {
    await db.collection("users").updateOne(
      {userId : senderId , "chats.friend" : normalizedReceiverId},
      {$push:{"chats.$.messages" : {_id : messageId, type : "sent", message: msg}}} 
    );
  }
  
  const y = await db.collection("users").findOne({userId : normalizedReceiverId , "chats.friend" : senderId});
  if(!y) {
    const receiverResult = await db.collection("users").updateOne(
      { userId:normalizedReceiverId },
      {
        $push: {
          chats: {
            friend: senderId,
            messages: [
              {
                _id : messageId,
                type: "received",
                message: msg
              }
            ]
          }
        }
      }
    );
    if (receiverResult.matchedCount !== 1) {
      throw new Error("Receiver user was not found");
    }
  }
  else {
    await db.collection("users").updateOne(
      {userId : normalizedReceiverId , "chats.friend" : senderId},
      {$push:{"chats.$.messages" : {_id : messageId, type : "received", message: msg}}} 
    );
  }
  
  return { success: true, messageId: messageId.toString() };
}

export async function sendUsersRequested() {
  const user_data = await requireUser()
  const userId = user_data.id
     const db = await connectDB();
  const user = await db.collection("users").findOne({ userId: userId },{projection : {request_sent : 1,_id : 0}});
  return user.request_sent;
}

export async function getChatAction(friendId) {
  const user_data = await requireUser()
  const userId = user_data.id
  const normalizedFriendId = Number(friendId);
  if (!Number.isInteger(normalizedFriendId)) {
    throw new Error("Invalid friend ID");
  }
  const db = await connectDB();
  const user = await db.collection("users").findOne(
    { userId: userId, "chats.friend": normalizedFriendId }, 
    { projection: { "chats.$": 1 } }
  );
  if (user && user.chats && user.chats.length > 0) {
    // Map _id to string so it can be passed to client components
    return user.chats[0].messages.map(m => ({
      ...m,
      _id: m._id.toString()
    }));
  }
  return [];
}
export async function deleteChatAction( friendId, messageId) {
  
  const user_data = await requireUser();
  const userId = user_data.id
  const normalizedFriendId = Number(friendId);
  if (!Number.isInteger(normalizedFriendId) || !ObjectId.isValid(messageId)) {
    throw new Error("Invalid chat message");
  }
  const db = await connectDB();

  const result = await db.collection("users").updateOne(
    {
      userId: userId,
      "chats.friend": normalizedFriendId
    },
    {
      $pull: {
        "chats.$.messages": {
          _id: new ObjectId(messageId)
        }
      }
    }
  );

  if (result.modifiedCount !== 1) {
    throw new Error("Message was not found");
  }
  return { success: true };
}
// Add this to: app/actions/users.js (or wherever your database actions are)

export async function getNetworkAction(type, page = 1, limit = 10) {
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();
  const user = await db.collection("users").findOne({ userId: userId });
  if (!user) return [];
  
  // Determine which array to look at based on the active tab
  const list = type === "followers" ? user.followers : user.followed;
  if (!list || list.length === 0) return [];
  
  // Pagination logic: Get a small slice of IDs (lazy loading)
  const startIndex = (page - 1) * limit;
  const paginatedIds = list.slice(startIndex, startIndex + limit);

  if (paginatedIds.length === 0) return [];

  // Fetch the specific user details (name, dp, etc.) for these IDs
  const users = await db.collection("users")
    .find({ userId: { $in: paginatedIds } })
    .project({ userId: 1, userName: 1, dp: 1 })
    .toArray();

  return users.map(u => ({ ...u, _id: u._id.toString() }));
}

// ─── GET FOLLOW REQUESTS (PAGINATED) ────────────────────────────────────────
// Returns users who sent YOU a follow request, in small lazy-loaded chunks
export async function getFollowRequestsAction(page = 1, limit = 8) {
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();
  const user = await db.collection("users").findOne({ userId: userId });

  if (!user || !user.request_came || user.request_came.length === 0) {
    return { users: [], hasMore: false };
  }

  const startIndex = (page - 1) * limit;
  const paginatedIds = user.request_came.slice(startIndex, startIndex + limit);

  if (paginatedIds.length === 0) {
    return { users: [], hasMore: false };
  }

  const users = await db.collection("users")
    .find({ userId: { $in: paginatedIds } })
    .project({ userId: 1, userName: 1, dp: 1 })
    .toArray();

  const hasMore = startIndex + limit < user.request_came.length;

  return {
    users: users.map(u => ({ ...u, _id: u._id.toString() })),
    hasMore,
  };
}


// ─── GET SUGGESTED USERS (PAGINATED) ────────────────────────────────────────
// Smart suggestions based on:
//   1. Friends of friends (people your following are following)
//   2. Users who liked or commented on YOUR posts
export async function getSuggestedUsersAction(page = 1, limit = 8) {
  const user_data = await requireUser();
  const userId = user_data.id;
  const db = await connectDB();
  const user = await db.collection("users").findOne({ userId: userId });

  if (!user) return { users: [], hasMore: false };

  // ── Build a Set of userIds we must EXCLUDE (yourself, already following, pending requests)
  const excludeSet = new Set();
  excludeSet.add(userId);
  (user.followed || []).forEach(id => excludeSet.add(id));
  (user.followers || []).forEach(id => excludeSet.add(id));
  (user.request_sent || []).forEach(id => excludeSet.add(id));
  (user.request_came || []).forEach(id => excludeSet.add(id));

  // ── Strategy 1: Friends of friends ──
  // For every person I follow, get the people THEY follow
  let fofIds = [];
  if (user.followed && user.followed.length > 0) {
    const friends = await db.collection("users")
      .find({ userId: { $in: user.followed } })
      .project({ followed: 1 })
      .toArray();

    friends.forEach(f => {
      (f.followed || []).forEach(id => {
        if (!excludeSet.has(id)) fofIds.push(id);
      });
    });
  }


  // ── Merge & deduplicate, keeping friends-of-friends first (higher relevance)
  const seen = new Set();
  const mergedIds = [];

  // Friends-of-friends get priority
  for (const id of fofIds) {
    if (!seen.has(id)) { seen.add(id); mergedIds.push(id); }
  }
  // ── Paginate the merged result
  const startIndex = (page - 1) * limit;
  const pageIds = mergedIds.slice(startIndex, startIndex + limit);

  if (pageIds.length === 0) {
    return { users: [], hasMore: false };
  }

  const suggestedUsers = await db.collection("users")
    .find({ userId: { $in: pageIds } })
    .project({ userId: 1, userName: 1, dp: 1 })
    .toArray();

  // Preserve the priority order from mergedIds
  const ordered = pageIds.map(id => suggestedUsers.find(u => u.userId === id)).filter(Boolean);

  const hasMore = startIndex + limit < mergedIds.length;

  return {
    users: ordered.map(u => ({ ...u, _id: u._id.toString() })),
    hasMore,
  };
}

export async function userForSearchAction(search, page = 1, limit = 8) {
  const user_data = await requireUser();
  const userId = user_data.id
  const db = await connectDB();

  const skip = (page - 1) * limit;

  const query = {
    userName: { $regex: search, $options: "i" },
    userId: { $ne: userId },
  };

  const users = await db
    .collection("users")
    .find(query)
    .project({ userId: 1, userName: 1, dp: 1 })
    .skip(skip)
    .limit(limit + 1) // fetch one extra to check hasMore
    .toArray();

  const hasMore = users.length > limit;
  if (hasMore) users.pop(); // remove the extra probe document

  return {
    users: users.map((u) => ({ ...u, _id: u._id.toString() })),
    hasMore,
  };
}


export async function giveUserPost(page = 1, limit = 10) {
  const user_data = await requireUser();
  const userId = user_data.id ?? user_data.userId;
  const db = await connectDB();
  const skip = (page - 1) * limit;

  const numericId = !isNaN(Number(userId)) ? Number(userId) : userId;
  const user = await db.collection("users").findOne({
    $or: [{ userId: numericId }, { userId: String(userId) }],
  });

  console.log(userId, user);

  if (!user || !user.posts || user.posts.length === 0) {
    return { posts: [], hasMore: false };
  }

  const posts = user.posts;
  let res = await db
    .collection("posts")
    .find({ postId: { $in: posts } })
    .skip(skip)
    .limit(limit + 1)
    .toArray();

  const hasMore = res.length > limit;
  if (hasMore) res.pop(); // remove the extra probe document
  res = res.filter((u) => u.status !== "draft");

  return {
    posts: res.map((u) => ({ ...u, _id: u._id.toString() })),
    hasMore,
  };
}


export async function getUserBookmarksPaginationAction(page = 1, limit = 10) {
  const user_data = await requireUser();
  const userId = user_data.id;
  const db = await connectDB();
  const numericId = !isNaN(Number(userId)) ? Number(userId) : userId;
  const user = await db.collection("users").findOne({
    $or: [{ userId: numericId }, { userId: String(userId) }],
  });

  if (!user || !user.bookmarks || user.bookmarks.length === 0) {
    return { posts: [], hasMore: false };
  }
  const skip = (page - 1) * limit;
  // Fetch ALL bookmarked posts in one single database call using $in
  const res = await db
    .collection("posts")
    .find({ postId: { $in: user.bookmarks } })
    .skip(skip)
    .limit(limit + 1)
    .toArray();

  const hasMore = res.length > limit;
  if (hasMore) res.pop(); // remove the extra probe document
  const rres = res.filter((u) => u.status !== "draft");
  return {
    posts: rres.map((u) => ({ ...u, _id: u._id.toString() })),
    hasMore,
  };
}
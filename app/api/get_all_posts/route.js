import { connectDB } from "../../../lib/mongodb";
import { requireUser } from "../../../lib/require-user";
export async function GET(req) {
    try {
        console.log("came to get all posts");
        const db = await connectDB();
        const url = new URL(req.url);
        
        // Extract query parameters
        const search = url.searchParams.get("search") || "";
        const category = url.searchParams.get("category") || "All Posts";
        const page = parseInt(url.searchParams.get("page")) || 1;
        const limit = parseInt(url.searchParams.get("limit")) || 10;
        console.log("to query " + search+ " " + category )
          const user_data = await requireUser();
          console.log("to check is : " + user_data.userId)
          const userId = user_data.id
        // Build query
        const query = {};
        if (search) {
            query.title = { $regex: search, $options: "i" }; // Case-insensitive search on title
        }
        if (category === "Recommended" && userId !== "") {
            // 1. Fetch the user's data
            const numericUserId = !isNaN(Number(userId)) ? Number(userId) : userId;
            const user = await db.collection("users").findOne({
                $or: [{ userId: numericUserId }, { userId: userId }]
            });
    
    if (user) {
        // 2. Gather IDs of posts the user interacted with
        const interactedPostIds = [
            ...(user.likes || []),
            ...(user.bookmarks || []),
            ...(user.comments?.map(c => c.post) || [])
        ];

        // 3. Fetch these interacted posts to see what categories they like
        const interactedPosts = await db.collection("posts")
            .find({ postId: { $in: interactedPostIds } })
            .toArray();

        // 4. Extract unique categories and tags
        const preferredCategories = interactedPosts.reduce((acc, post) => {
            if (post.category) acc.add(post.category);
            if (post.tags) post.tags.forEach(t => acc.add(t));
            return acc;
        }, new Set());

        // Fixed syntax error and used 'request_sent' to match your database
        const followedUsers = [...(user.followed || []), ...(user.request_sent || [])];

        const personalizedQuery = {
            $or: [
                { category: { $in: Array.from(preferredCategories) } },
                { tags: { $in: Array.from(preferredCategories) } },
                { userId: { $in: followedUsers } }
            ]
        };

        // 5. Calculate ratios for pagination (e.g., if limit is 10)
        // 60% Personalized, 20% Trending, 20% Normal/Recent
        const pLimit = Math.ceil(limit * 0.6);
        const tLimit = Math.ceil(limit * 0.2);
        const nLimit = limit - pLimit - tLimit;

        // 6. Fetch all 3 feeds AT THE SAME TIME using Promise.all (Super fast, no extra API load!)
        const [personalized, trending, normal] = await Promise.all([
            db.collection("posts").find(personalizedQuery).sort({ createdAt: -1 }).skip((page - 1) * pLimit).limit(pLimit).toArray(),
            db.collection("posts").find({}).sort({ likes: -1 }).skip((page - 1) * tLimit).limit(tLimit).toArray(),
            db.collection("posts").find({}).sort({ createdAt: -1 }).skip((page - 1) * nLimit).limit(nLimit).toArray()
        ]);

        // 7. Merge them together
        let combined = [...personalized, ...trending, ...normal];
        combined = combined.filter((i) => {
            i.status === "published"
        })
        // 8. Remove any duplicates (in case a trending post is also a personalized one)
        const uniquePosts = Array.from(new Map(combined.map(p => [p.postId, p])).values());

        // 9. Shuffle the array so the feed looks natural and perfectly blended
        const shuffledPosts = uniquePosts.sort(() => Math.random() - 0.5);

        // 10. Estimate total pages (cheaper than counting exactly)
        const approxTotalPosts = await db.collection("posts").countDocuments();
        
        // Return immediately so we skip the default query logic below
        return Response.json({ 
            dt: shuffledPosts, 
            totalPages: Math.ceil(approxTotalPosts / limit),
            currentPage: page
        });
    }
} else if (category && category !== "All Posts") {
    // Normal category filter if they select a specific category
    query.tags = { $regex: category, $options: "i" }; 
}
        const skip = (page - 1) * limit;

        const totalPosts = await db.collection("posts").countDocuments(query);
        const posts = await db.collection("posts")
            .find(query)
            .skip(skip)
            .limit(limit)
            .toArray();

        return Response.json({ 
            dt: posts, 
            totalPages: Math.ceil(totalPosts / limit),
            currentPage: page
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
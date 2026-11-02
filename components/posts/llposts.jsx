"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Bookmark,
  CalendarDays,
  Grid2X2,
  LayoutList,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getUserCommentsAction, getUserBookmarksAction } from "../../app/actions/users";
import DisplayDp from "../display_dp";
export default function DashboardPage() {
  console.log("came in dashboard page");
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Posts");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, userId } = useAuth()
  const router = useRouter(); // Add this line
  const [activeTab, setActiveTab] = useState("posts");
  const [comments, setComments] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState(null);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [layout, setLayout] = useState("grid");
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/get_all_posts?search=${search}&category=${category}&page=${page}&limit=10`);
        const data = await res.json();
        if (data.dt) {
          console.log("posts response:", data.dt);
          console.table(
            data.dt.map((post, index) => ({
              index,
              postId: post.postId,
              title: post.title,
              contentType: typeof post.content,
              tagsType: typeof post.tags,
              coverType: typeof post.cover,
              dateType: typeof post.date,
              commentsType: typeof post.comments,
              fullPost: JSON.stringify(post),
            }))
          );

          setPosts(data.dt);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [search, category, page, userId]);

  useEffect(() => {
    const currentUserId = userId !== null && userId !== undefined ? userId : user?.userId;
    if (currentUserId === null || currentUserId === undefined) return;

    if (activeTab === "comments" && comments === null) {
      setCommentsLoading(true);
      getUserCommentsAction()
        .then(data => setComments(data || []))
        .catch(err => {
          console.error("Error fetching comments:", err);
          setComments([]);
        })
        .finally(() => setCommentsLoading(false));
    }

    if (activeTab === "bookmarks" && bookmarks === null) {
      setBookmarksLoading(true);
      getUserBookmarksAction()
        .then(data => setBookmarks(data || []))
        .catch(err => {
          console.error("Error fetching bookmarks:", err);
          setBookmarks([]);
        })
        .finally(() => setBookmarksLoading(false));
    }
  }, [activeTab, userId, user, comments, bookmarks]);

  return (
    <div className="min-h-screen bg-[#020617] text-white px-4 md:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Navbar */}
        <nav className="flex items-center justify-between flex-wrap gap-5 border border-white/10 rounded-3xl px-5 py-4 bg-[#071126]/80 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
              <Menu size={20} />
            </div>

            <h1 className="text-2xl font-bold">
              Write<span className="text-violet-500">Flow</span>
            </h1>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-10 text-[16px] text-gray-300">
            {/* Redirect Buttons */}
            <button
              onClick={() => router.push(`/dashboard`)} // Update this with your actual dashboard route
              className="hover:text-white transition"
            >
              Dashboard
            </button>

            <button
              onClick={() => router.push("/get_title")} // Update this with your actual generate post route
              className="hover:text-white transition"
            >
              Generate Post
            </button>

            {/* In-Page Tab Buttons */}
            <button
              onClick={() => setActiveTab("posts")}
              className={`transition ${activeTab === 'posts' ? 'text-violet-400 border-b-2 border-violet-500 pb-1' : 'hover:text-white'}`}
            >
              Posts
            </button>

            <button
              onClick={() => setActiveTab("comments")}
              className={`transition ${activeTab === 'comments' ? 'text-violet-400 border-b-2 border-violet-500 pb-1' : 'hover:text-white'}`}
            >
              Comments
            </button>

            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`transition ${activeTab === 'bookmarks' ? 'text-violet-400 border-b-2 border-violet-500 pb-1' : 'hover:text-white'}`}
            >
              Bookmarks
            </button>
          </div>
          {/* Right */}
          <div className="flex items-center gap-4">
            <button className="hidden md:flex items-center gap-2 bg-violet-600 hover:bg-violet-500 transition px-5 py-3 rounded-2xl font-medium">
              <Plus size={18} />
              Generate New Post
            </button>

            <DisplayDp userId = {userId}/>
          </div>
        </nav>

        {/* Hero */}
        <section className="mt-12">
          <h2 className="text-gray-300 text-2xl md:text-3xl">
            Welcome back,
          </h2>

          <h1 className="text-4xl md:text-6xl font-bold mt-2">
          {typeof user === "object" && user !== null
            ? (user.user || user.userName || user.name || user.email || "")
            : (user || "")} 👋
          </h1>

          <p className="text-gray-400 mt-4 max-w-2xl text-lg">
            Manage your content and share your thoughts with the world.
          </p>
        </section>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-14 gap-5">
          <h2 className="text-3xl font-bold">All Posts</h2>
          <div className="flex-1 max-w-md mx-auto w-full md:mx-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 bg-[#111827] border border-white/10 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              placeholder="Search posts by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              className="bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-gray-300 outline-none focus:border-violet-500"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            >
              <option>All Posts</option>
              <option>Technology</option>
              <option>programming</option>
              <option>business</option>
            </select>

            <button className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${layout === "grid" ? "bg-violet-600" : "bg-[#111827] border border-white/10 hover:bg-white/5"}`}>
              <Grid2X2 size={20} onClick={() => setLayout("grid")} />
            </button>

            <button className={`w-12 h-12 rounded-xl flex items-center justify-center transition ${layout === "list" ? "bg-violet-600" : "bg-[#111827] border border-white/10 hover:bg-white/5"}`}>
              <LayoutList size={20} onClick={() => setLayout("list")} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className={layout === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mt-10"
          : "flex flex-col gap-6 mt-10"
        }>
          {activeTab === "posts" && (
            loading ? (
              <div className="col-span-full text-center py-12 text-violet-400 font-medium animate-pulse">
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No posts found.
              </div>
            ) : (
              posts.map((post) => display_post(post))
            )
          )}

          {activeTab === "comments" && (
            commentsLoading || comments === null ? (
              <div className="col-span-full text-center py-12 text-violet-400 font-medium animate-pulse">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No comments found.
              </div>
            ) : (
              comments.map((x, idx) => (
                <div key={idx} className="bg-[#071126] border border-white/10 rounded-3xl p-5 flex flex-col gap-4">
                  {x.post ? (
                    display_post(x.post)
                  ) : (
                    <div className="text-gray-500 italic p-4 text-center">Post unavailable or deleted</div>
                  )}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <span className="text-xs text-gray-400 block mb-1">Your Comment:</span>
                    <p className="text-gray-200 text-sm">{x.comment}</p>
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === "bookmarks" && (
            bookmarksLoading || bookmarks === null ? (
              <div className="col-span-full text-center py-12 text-violet-400 font-medium animate-pulse">
                Loading bookmarks...
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No bookmarks found.
              </div>
            ) : (
              bookmarks.map((x, idx) => {
                const postItem = x.post || x;
                return (
                  <div key={idx} className="relative">
                    {display_post(postItem)}
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-14">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`w-12 h-12 rounded-xl border border-white/10 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'} bg-[#071126]`}
            >
              {"<"}
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-12 h-12 rounded-xl ${page === p ? 'bg-violet-600' : 'border border-white/10 bg-[#071126] hover:bg-white/5'}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className={`w-12 h-12 rounded-xl border border-white/10 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'} bg-[#071126]`}
            >
              {">"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
  
  function display_post(post) {
    console.log("Rendering post:", {
  postId: post.postId,
  title: post.title,
  content: post.content,
  tags: post.tags,
  cover: post.cover,
  date: post.date,
});
    if (!post) return null;
    return (
      <div
        onClick={() => router.push(`/Postprticulr/${post.postId}`)}
        key={post.postId}
        className={`group cursor-pointer bg-[#071126] border border-white/10 rounded-3xl overflow-hidden hover:border-violet-500/50 transition duration-300 ${layout === "list" ? "flex flex-col md:flex-row" : ""}`}
      >
        {/* Image */}
        <div className={`relative overflow-hidden bg-white/5 ${layout === "list" ? "w-full md:w-[35%] min-h-[220px]" : "h-[240px] w-full"}`}>
          {post.cover ? (
            <Image
              src={post.cover}
              alt={post.title || "Cover"}
              fill
              className="object-cover group-hover:scale-105 transition duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No Cover Image
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-6 flex flex-col justify-between ${layout === "list" ? "w-full md:w-[65%]" : ""}`}>
          <h3 className="text-3xl font-bold leading-tight">
            {post.title || "Untitled"}
          </h3>

          <p className="text-gray-400 mt-4 leading-7 text-[17px] line-clamp-3">
            {post.content || ""}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-5">
            {(post.tags || []).map((tag, i) => (
              <span
                key={i}
                className="px-3 py-2 rounded-xl bg-violet-500/15 border border-violet-500/20 text-violet-300 text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-7 text-gray-400">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} />
              <span>{post.date || ""}</span>
            </div>

            <button
              className="hover:text-violet-400 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <Bookmark size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }
}


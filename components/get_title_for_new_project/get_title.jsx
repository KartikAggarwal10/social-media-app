"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { createPostAction } from "../../app/actions/posts";

export default function GetTitleModal({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();
  console.log("-->" + userId)
  if (!isOpen) return null;

  async function handleCreatePost(e) {
    if (e) e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title for your post.");
      return;
    }

    if (userId === null || userId === undefined) {
      setError("User session not found. Please log in first.");
      return;
    }

    setLoading(true);
    try {
      // Server Action — creates post directly on server, no HTTP roundtrip
      const data = await createPostAction(title.trim());
      const newPostId = data.postId;

      if (!newPostId && newPostId !== 0) {
        throw new Error("Invalid post ID returned from server.");
      }

      // 🚀 Redirect to the CreatePost editor page with the new postId!
      router.push(`/create_posts/${newPostId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-white/10 p-6 md:p-8 shadow-2xl backdrop-blur-xl text-white">
        
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 transition text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-center gap-3 text-cyan-400 mb-2">
          <Sparkles size={22} />
          <span className="text-xs uppercase tracking-widest font-semibold">Start Writing</span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight">Name Your New Post</h2>
        <p className="text-sm text-white/60 mt-1 mb-6">
          Give your post a working title. You can always refine it later in the editor.
        </p>

        <form onSubmit={handleCreatePost} className="space-y-4">
          <div>
            <input
              type="text"
              autoFocus
              placeholder="e.g. 10 Insights on Modern Web Architecture"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-cyan-400 focus:bg-white/10 outline-none transition text-white placeholder-white/40 text-base"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-semibold transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 font-semibold shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                "Creating..."
              ) : (
                <>
                  Continue to Editor <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
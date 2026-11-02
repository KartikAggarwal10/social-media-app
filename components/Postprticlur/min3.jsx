"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PostCard from "./PostCard";

export function Min({post_id}) {
    const [postData, setPostData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (post_id === null || post_id === undefined) return;

        async function fetchPostAndUser() {
            try {
                setLoading(true);

                // Fetch the post
                const postRes = await fetch(`/api/give_prticulr_post/${post_id}`);
                const { dt: post } = await postRes.json();

                if (!post) {
                    setPostData(null);
                    return;
                }

                // Fetch the post's author info
                const userRes = await fetch(`/api/get_user/${post.userId}`);
                const { dt: user } = await userRes.json();

                // Merge user info into the post object
                setPostData({ ...post, ...user });
            } catch (err) {
                console.error("Failed to fetch post details:", err);
                setPostData(null);
            } finally {
                setLoading(false);
            }
        }

        fetchPostAndUser();
    }, [post_id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-white">
                <p className="text-lg animate-pulse">Loading post...</p>
            </div>
        );
    }

    if (!postData) {
        return (
            <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-white">
                <p className="text-lg">Post not found.</p>
            </div>
        );
    }

    return <PostCard post={postData} />;
}

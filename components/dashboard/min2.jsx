"use client";
import { useState, useEffect } from "react";
import PostsDashboard from "./PostsDashboard";
import { useAuth } from "../../context/AuthContext";

export function Min() {
    const { userId, loading } = useAuth();
    const [posts, setPosts] = useState([]);
    const [fetching, setFetching] = useState(true);
   console.log("__>" + userId)
    useEffect(() => {
        // Don't fetch until auth has loaded and we have a valid userId
        if (loading || userId == null || userId == undefined) return;

        async function fetchPosts() {
            try {
                setFetching(true);
                const res = await fetch(`/api/give_post_for_dshbord`);
                const { dt } = await res.json();
                setPosts(dt || []);
            } catch (err) {
                console.error("Failed to fetch dashboard posts:", err);
                setPosts([]);
            } finally {
                setFetching(false);
            }
        }

        fetchPosts();
    }, [userId, loading]);

    if (loading || fetching) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center text-white">
                <p className="text-lg animate-pulse">Loading dashboard...</p>
            </div>
        );
    }

    if (userId === null || userId === undefined) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center text-white">
                <p className="text-lg">Please log in to view your dashboard.</p>
            </div>
        );
    }

    return <PostsDashboard nme={userId} posts={posts} />;
}

"use client";

import React, { useMemo, useState } from "react";
import {
  Eye,
  FileText,
  Heart,
  MessageCircle,
  MoreVertical,
  PlusCircle,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import GetTitleModal from "../get_title_for_new_project/get_title";

const CHART_WIDTH = 860;
const CHART_HEIGHT = 260;
const CHART_PADDING = { top: 24, right: 28, bottom: 42, left: 44 };

function getLikeCount(value) {
  if (Array.isArray(value)) return value.length;
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

function getComments(post) {
  return Array.isArray(post.comments) ? post.comments : [];
}

function getCommentText(comment) {
  if (typeof comment === "string") return comment;
  return comment?.comment || comment?.text || comment?.content || "";
}

function getCommentAuthor(comment) {
  if (typeof comment === "string") return "Community member";
  return comment?.user || comment?.author || comment?.userName || "Community member";
}

function makePath(points, key) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].cx} ${points[0][key]}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.cx} ${point[key]}`;
    const previous = points[index - 1];
    const midpoint = previous.cx + (point.cx - previous.cx) / 2;
    return `${path} C ${midpoint} ${previous[key]}, ${midpoint} ${point[key]}, ${point.cx} ${point[key]}`;
  }, "");
}

export default function PostsDashboard({ nme, posts }) {
  const postsData = useMemo(() => (Array.isArray(posts) ? posts : []), [posts]);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const filteredPosts = useMemo(() => {
    if (currentFilter === "all") return postsData;
    return postsData.filter((post) => post.status === currentFilter);
  }, [currentFilter, postsData]);

  const totalLikes = postsData.reduce(
    (total, post) => total + getLikeCount(post.likes),
    0,
  );
  const totalComments = postsData.reduce(
    (total, post) => total + getComments(post).length,
    0,
  );
  const totalPublished = postsData.filter(
    (post) => post.status === "published",
  ).length;

  const formatNum = (value) => {
    const number = Number(value) || 0;
    if (number >= 1000) return `${(number / 1000).toFixed(1).replace(".0", "")}k`;
    return number.toLocaleString();
  };

  const graphData = useMemo(() => {
    if (postsData.length === 0) return null;

    const width = CHART_WIDTH;
    const height = CHART_HEIGHT;
    const plotWidth = width - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;
    const points = postsData.map((post, index) => ({
      x: index,
      cx:
        postsData.length === 1
          ? width / 2
          : CHART_PADDING.left + (index / (postsData.length - 1)) * plotWidth,
      likes: getLikeCount(post.likes),
      comments: getComments(post).length,
      title: post.title || `Post #${index + 1}`,
    }));
    const maxValue = Math.max(
      4,
      ...points.flatMap((point) => [point.likes, point.comments]),
    );
    const toY = (value) =>
      height - CHART_PADDING.bottom - (value / maxValue) * plotHeight;
    const coordinates = points.map((point) => ({
      ...point,
      likesY: toY(point.likes),
      commentsY: toY(point.comments),
    }));

    return {
      width,
      height,
      maxValue,
      coordinates,
      likesPath: makePath(coordinates, "likesY"),
      commentsPath: makePath(coordinates, "commentsY"),
    };
  }, [postsData]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-4 text-white md:p-8">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-violet-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-cyan-500/20 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl md:p-10">
        <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl font-bold shadow-xl shadow-violet-500/30">
            {String(nme || "A").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{nme}</h1>
            <p className="mt-2 text-sm text-white/70 md:text-base">
              Content Author · {postsData.length} posts
            </p>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Heart size={18} />} title="Total Likes" value={formatNum(totalLikes)} />
          <StatCard icon={<MessageCircle size={18} />} title="Comments" value={formatNum(totalComments)} />
          <StatCard icon={<FileText size={18} />} title="Published" value={totalPublished} />
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex min-h-[140px] items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3.5 font-semibold shadow-lg shadow-violet-500/30 transition-all hover:scale-[1.03] hover:from-violet-500 hover:to-cyan-400"
          >
            <PlusCircle size={20} />
            Create New Post
          </button>
        </div>

        <section className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/30 p-5 backdrop-blur-md md:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="text-cyan-400" size={20} />
                <h2 className="text-lg font-bold">Engagement by post</h2>
              </div>
              <p className="mt-1 text-sm text-white/50">
                Compare likes and comments across your content.
              </p>
            </div>
            <div className="flex gap-4 text-xs font-medium text-white/70">
              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                Likes
              </span>
              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                Comments
              </span>
            </div>
          </div>

          {graphData ? (
            <div className="w-full overflow-x-auto">
              <div className="relative min-w-[620px]">
                <svg
                  viewBox={`0 0 ${graphData.width} ${graphData.height}`}
                  className="h-64 w-full overflow-visible"
                  role="img"
                  aria-label="Likes and comments per post"
                >
                  <defs>
                    <linearGradient id="likesLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#67e8f9" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                    <linearGradient id="commentsLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#c4b5fd" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y =
                      graphData.height -
                      CHART_PADDING.bottom -
                      ratio *
                        (graphData.height -
                          CHART_PADDING.top -
                          CHART_PADDING.bottom);
                    return (
                      <g key={ratio}>
                        <line
                          x1={CHART_PADDING.left}
                          y1={y}
                          x2={graphData.width - CHART_PADDING.right}
                          y2={y}
                          stroke="rgba(255,255,255,0.09)"
                          strokeDasharray="4 6"
                        />
                        <text
                          x={CHART_PADDING.left - 10}
                          y={y + 4}
                          fill="rgba(255,255,255,0.42)"
                          fontSize="10"
                          textAnchor="end"
                        >
                          {Math.round(graphData.maxValue * ratio)}
                        </text>
                      </g>
                    );
                  })}
                  <path
                    d={graphData.likesPath}
                    fill="none"
                    stroke="url(#likesLine)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="4"
                  />
                  <path
                    d={graphData.commentsPath}
                    fill="none"
                    stroke="url(#commentsLine)"
                    strokeDasharray="7 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                  {graphData.coordinates.map((point) => (
                    <g key={point.x}>
                      <circle
                        cx={point.cx}
                        cy={point.likesY}
                        r={hoveredPoint?.x === point.x ? 7 : 4}
                        fill="#67e8f9"
                        stroke="#082f49"
                        strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <circle
                        cx={point.cx}
                        cy={point.commentsY}
                        r={hoveredPoint?.x === point.x ? 6 : 3.5}
                        fill="#c4b5fd"
                        stroke="#312e81"
                        strokeWidth="2"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  ))}
                </svg>
                {hoveredPoint && (
                  <div
                    className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-cyan-400/30 bg-slate-900/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
                    style={{
                      left: `${(hoveredPoint.cx / graphData.width) * 100}%`,
                      top: `${Math.min(hoveredPoint.likesY, hoveredPoint.commentsY) - 8}px`,
                    }}
                  >
                    <p className="max-w-[180px] truncate font-semibold text-white">
                      {hoveredPoint.title}
                    </p>
                    <p className="mt-1 text-cyan-300">♥ {formatNum(hoveredPoint.likes)} likes</p>
                    <p className="text-violet-300">● {formatNum(hoveredPoint.comments)} comments</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-white/40">
              No post activity recorded yet to generate the graph.
            </div>
          )}
        </section>

        <GetTitleModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

        <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Posts</p>
            <h2 className="mt-2 text-2xl font-bold">Manage Your Content</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {["all", "published", "draft"].map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setCurrentFilter(filter)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold capitalize transition-all duration-300 ${
                  currentFilter === filter
                    ? "scale-105 border-transparent bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          {filteredPosts.map((post) => {
            const comments = getComments(post);
            return (
              <article
                key={post.postId}
                className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.08] hover:shadow-2xl hover:shadow-cyan-500/10 md:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-white transition group-hover:text-cyan-300 md:text-xl">
                        <Link href={post.status === "draft" ? `create_posts/${post.postId}` : `/Postprticulr/${post.postId}`}>
                          {post.title}
                        </Link>
                      </h3>
                      {post.status === "draft" && (
                        <span className="rounded-full border border-amber-300/20 bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
                          Draft
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-5 text-sm text-white/70">
                      <span className="flex items-center gap-2">
                        <Heart size={17} /> {formatNum(getLikeCount(post.likes))}
                      </span>
                      <span className="flex items-center gap-2">
                        <MessageCircle size={17} /> {formatNum(comments.length)}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                        Comments
                      </p>
                      {comments.length > 0 ? (
                        <div className="max-h-36 space-y-2 overflow-y-auto pr-2">
                          {comments.map((comment, index) => (
                            <div key={`${post.postId}-comment-${index}`} className="rounded-2xl bg-slate-950/30 px-3 py-2.5">
                              <p className="text-sm leading-relaxed text-white/85">
                                {getCommentText(comment) || "Comment content unavailable."}
                              </p>
                              <p className="mt-1 text-xs text-cyan-300/70">{getCommentAuthor(comment)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-white/40">No comments yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="relative flex items-center gap-3 lg:pt-1">
                    <div className="text-sm font-medium text-white/50">{post.date || "—"}</div>
                    <button
                      type="button"
                      aria-label={`Open actions for ${post.title}`}
                      onClick={() => setOpenMenuId(openMenuId === post.postId ? null : post.postId)}
                      className="rounded-full p-2 transition hover:bg-white/10"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenuId === post.postId && (
                      <div className="absolute right-0 top-12 z-50 w-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
                        <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/10" onClick={() => setOpenMenuId(null)}>
                          <Eye size={16} /> View
                        </button>
                        <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10" onClick={() => setOpenMenuId(null)}>
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="relative min-h-[140px] overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-[1.03]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-cyan-300">
          {icon}
          <span>{title}</span>
        </div>
        <h3 className="text-4xl font-extrabold tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { checkFollowStatusAction,cancelFollowAction,sendFollowRequestAction,isbookmarked,addbookmarkaction,removebookmarkaction } from "../../app/actions/users";
import { useAuth } from "../../context/AuthContext";
import { toggleLikeAction,checkUserLikedAction,addCommentAction,getAllCommentsAction } from "../../app/actions/posts";
import { Bookmark} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import DisplayDp from "../display_dp";
const REACTION_LIST = ["❤️", "🔥", "😮", "👏", "😂", "😢"];

// ─────────────────────────────────────────────────────────────────────────────
// Normalize flat DB data into the shape the UI expects.
// This keeps all JSX untouched — only this block needs to know the DB schema.
// ─────────────────────────────────────────────────────────────────────────────
function normalizePost(raw) {
  if (!raw) return null;

  // If the data already has the nested shape (e.g. from mock), return as-is
  if (raw.author && raw.content?.text !== undefined && raw.stats) return raw;

  return {
    ...raw,
    // Author block (merged from user doc)
    author: {
      id:       raw.userId ?? "",
      name:     raw.userName || raw.name || "Unknown",
      username: raw.userName || raw.name || "user",
      avatar:   raw.dp || "/user.png",
      verified: false,
    },
    // Content block
    content: {
      text:   typeof raw.content === "string" ? raw.content : (raw.content?.text || ""),
      images: raw.cover ? [raw.cover] : (raw.content?.images || []),
    },
    // Stats
    stats: {
      likes:    typeof raw.likes === "number" ? raw.likes : (Array.isArray(raw.likes) ? raw.likes.length : 0),
      comments: Array.isArray(raw.comments) ? raw.comments.length : 0,
      shares:   raw.shares || 0,
    },
    // Reactions (not stored in DB — start empty)
    reactions: raw.reactions || {},
    // Rating
    rating: raw.rating || 0,
    // Timestamp
    timestamp: raw.publishedAt
      ? new Date(raw.publishedAt).toLocaleDateString()
      : raw.createdAt
        ? new Date(raw.createdAt).toLocaleDateString()
        : "",
    // Comments normalized to UI shape
    comments: Array.isArray(raw.comments)
      ? raw.comments.map((c, i) => ({
          id:     i,
          user:   c.user ?? "User",
          avatar: "/user.png",
          text:   c.comment ?? c.text ?? "",
          time:   "",
        }))
      : [],
  };
}

export default function PostCard({ post: rawPost }) {
  // Normalize the incoming data
  const post = normalizePost(rawPost);

  // If post is somehow null, show fallback
  if (!post) {
    return (
      <div style={{minHeight: '100vh', background: '#0d0f14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'}}>
        <p>Post data unavailable.</p>
      </div>
    );
  }

  const[prv,setprv] = useState("")
  const[isbookmark,setisbookmark] = useState(false);
  const [followed, setFollowed] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats.likes);
  const [showReactions, setShowReactions] = useState(false);
  const [pickedReaction, setPickedReaction] = useState(null);
  const [reactions, setReactions] = useState(post.reactions);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments);
  const [activeImage, setActiveImage] = useState(0);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const recognitionRef = useRef(null);
  const {userId} = useAuth()
  const isFirstRender = useRef(true);

  const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat_bot',
        }),
    })

    // ── Watch AI messages and update aiResult ──
    useEffect(() => {
      if (messages && messages.length > 0) {
        const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
        if (lastAssistant) {
          setAiResult(lastAssistant.content || "");
          setAiLoading(false);
        }
      }
    }, [messages]);

    async function just_helper(){
      const x =  await checkFollowStatusAction(post.postId)
      setFollowed(x)
      setprv(x)
      const isliked = await  checkUserLikedAction(post.postId)
      setLiked(isliked)
      const comment = await  getAllCommentsAction(post.postId)
      if (comment) {
        setComments(comment.map((c, i) => ({
          id: i,
          user: c.user ?? "User",
          avatar: "/user.png",
          text: c.comment ?? c.text ?? "",
          time: "",
        })));
      }
      const booked = await  isbookmarked(post.postId)
      setisbookmark(booked.status)
    }
    useEffect(()=>{
      if (userId && post.postId !== undefined) {
        just_helper()
      }
    },[])

  // ── Voice / Listen ───────────────────────────────────────────────────────
  async function adding_removing_bookmark() {
    if(isbookmark) removebookmarkaction(post.postId)
    else addbookmarkaction(post.postId)
    setisbookmark(!isbookmark)
  }
  const toggleListen = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onresult = (e) => setAiQuery(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

   // ── Follow useEffect ──
   useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
       if(followed === "not_followed") {
          if(prv === "followed") cancelFollowAction(post.userId,"unfollow")
          else cancelFollowAction(post.userId,"request")
          setprv("not_followed")
       }
       else if (followed && followed !== "") {
          sendFollowRequestAction(post.userId)
       }
   },[followed])

  // ── AI Ask ───────────────────────────────────────────────────────────────
  const handleAsk = async () => {
    setAiLoading(true);
    setAiResult("")
    sendMessage({ text: aiQuery, metadata: { prompt: post.content.text } });
  };

  // ── Like ─────────────────────────────────────────────────────────────────
  const toggleLike = () => {
    setLiked((p) => !p);
    toggleLikeAction(post.postId,liked)
    setLikeCount((p) => (liked ? p - 1 : p + 1));
  };

  // ── Reaction ─────────────────────────────────────────────────────────────
  const pickReaction = (emoji) => {
    setPickedReaction((prev) => {
      const next = prev === emoji ? null : emoji;
      setReactions((r) => {
        const updated = { ...r };
        if (prev) updated[prev] = Math.max(0, (updated[prev] || 1) - 1);
        if (next) updated[next] = (updated[next] || 0) + 1;
        return updated;
      });
      return next;
    });
    setShowReactions(false);
  };

  // ── Comment submit ────────────────────────────────────────────────────────
  const submitComment = () => {
    if (!commentText.trim()) return;
    setComments((c) => [
      ...c,
      { id: Date.now(), user: "You", avatar: "/user.png", text: commentText.trim(), time: "just now" },
    ]);
    addCommentAction(post.postId,commentText.trim())
    setCommentText("");
    setShowComments(true);
  };

  // ── Follow button label ──
  const getFollowLabel = () => {
    if (followed === "followed") return "Following";
    if (followed === "requested") return "Requested";
    return "+ Follow";
  };

  const handleFollowClick = () => {
    if (followed === "followed" || followed === "requested") {
      setFollowed("not_followed");
    } else {
      setFollowed("requested");
    }
  };

  return (
    <>
    {/* .pc-text {
          font-size: 14px; line-height: 1.7;
          color: #c8c4bc; padding: 0 20px 16px;
          margin: 0;
        } */}
        {/* .pc-card {
          width: 100%;
          max-width: 600px;
          background: #13151d;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.07);
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both;
        } */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');

        .pc-wrap { 
          font-family: 'DM Sans', sans-serif;
          background: #0d0f14;
          min-height: 100vh;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 2.5rem 1rem;
        }

        
.pc-card {
  width: 100%;
  max-width: 600px;
  min-width: 0;

  background: #13151d;
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.07);

  overflow: hidden;
  box-sizing: border-box;

  box-shadow: 0 32px 80px rgba(0,0,0,0.6);
          animation: fadeUp 0.5s cubic-bezier(.22,1,.36,1) both;
}
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(24px); }
          to   { opacity:1; transform: translateY(0); }
        }

        /* ── Header ─────────────────────────────────── */
        .pc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px 14px;
        }
        .pc-author { display: flex; align-items: center; gap: 12px; }
        .pc-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,165,80,0.5);
        }
        .pc-name {
          font-family: 'Playfair Display', serif;
          font-size: 15px; font-weight: 500;
          color: #f0ece4;
          margin: 0;
        }
        .pc-meta { font-size: 12px; color: #6b6f7e; margin: 2px 0 0; }
        .pc-badge {
          font-size: 10px; background: rgba(255,165,80,0.15);
          color: #ffaa44; border-radius: 4px;
          padding: 1px 6px; margin-left: 6px; vertical-align: middle;
        }
        .pc-follow-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px; font-weight: 500;
          padding: 7px 18px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1.5px solid;
        }
        .pc-follow-btn.follow {
          background: transparent;
          border-color: rgba(255,165,80,0.5);
          color: #ffaa44;
        }
        .pc-follow-btn.follow:hover { background: rgba(255,165,80,0.1); }
        .pc-follow-btn.unfollow {
          background: rgba(255,165,80,0.12);
          border-color: rgba(255,165,80,0.3);
          color: #ffaa44;
        }

        /* ── Content ────────────────────────────────── */
        
          .pc-text {
  font-size: 14px;
  line-height: 1.7;
  color: #c8c4bc;
  padding: 0 20px 16px;
  margin: 0;

  /* IMPORTANT */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Prevent HTML elements inside post content from overflowing */
.pc-text * {
  max-width: 100%;
  box-sizing: border-box;
}

/* Images inside editor content */
.pc-text img {
  max-width: 100% !important;
  height: auto !important;
  display: block;
}

/* Tables generated by editor/content */
.pc-text table {
  width: 100% !important;
  max-width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.pc-text th,
.pc-text td {
  max-width: 0;
  padding: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Long links / URLs */
.pc-text a {
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Code blocks if they occur in posts */
.pc-text pre {
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* Make headings fit */
.pc-text h1,
.pc-text h2,
.pc-text h3,
.pc-text h4,
.pc-text h5,
.pc-text h6 {
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* Lists */
.pc-text ul,
.pc-text ol {
  max-width: 100%;
  padding-left: 25px;
  box-sizing: border-box;
}

        /* ── Image carousel ──────────────────────────── */
        .pc-images { position: relative; width: 100%; }
        .pc-img {
          width: 100%; height: 320px;
          object-fit: cover;
          display: block;
          transition: opacity 0.3s;
        }
        .pc-img-dots {
          position: absolute; bottom: 10px; left: 50%;
          transform: translateX(-50%);
          display: flex; gap: 5px;
        }
        .pc-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: rgba(255,255,255,0.35);
          cursor: pointer; transition: all 0.2s;
        }
        .pc-dot.active { background: #ffaa44; width: 18px; border-radius: 3px; }
        .pc-img-nav {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(0,0,0,0.45); border: none;
          color: #fff; width: 32px; height: 32px;
          border-radius: 50%; cursor: pointer; font-size: 16px;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s;
        }
        .pc-img-nav:hover { background: rgba(0,0,0,0.7); }
        .pc-img-prev { left: 10px; }
        .pc-img-next { right: 10px; }

        /* ── Stars ───────────────────────────────────── */
        .pc-stars { display: flex; gap: 3px; padding: 10px 20px 0; }
        .pc-star { font-size: 15px; opacity: 0.3; transition: opacity 0.2s; cursor: pointer; }
        .pc-star.lit { opacity: 1; }

        /* ── Actions ─────────────────────────────────── */
        .pc-actions {
          display: flex; align-items: center; gap: 6px;
          padding: 12px 20px 8px;
          flex-wrap: wrap;
        }
        .pc-action-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 99px;
          padding: 7px 14px;
          font-size: 13px; font-weight: 400;
          color: #9a9daa;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
        }
        .pc-action-btn:hover { background: rgba(255,255,255,0.09); color: #e0ddd8; }
        .pc-action-btn.liked { background: rgba(255,80,80,0.12); border-color: rgba(255,80,80,0.25); color: #ff6b6b; }
        .pc-action-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

        /* ── Reactions ───────────────────────────────── */
        .pc-reaction-wrap { position: relative; }
        .pc-reaction-picker {
          position: absolute; bottom: calc(100% + 8px); left: 0;
          background: #1e2130;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 99px;
          padding: 6px 10px;
          display: flex; gap: 8px;
          animation: popIn 0.15s cubic-bezier(.34,1.56,.64,1) both;
          z-index: 10;
          white-space: nowrap;
        }
        @keyframes popIn {
          from { opacity:0; transform: scale(0.8) translateY(4px); }
          to { opacity:1; transform: scale(1) translateY(0); }
        }
        .pc-emoji-btn {
          font-size: 20px; background: none; border: none;
          cursor: pointer; transition: transform 0.15s;
          line-height: 1;
        }
        .pc-emoji-btn:hover { transform: scale(1.35); }
        .pc-reactions-row {
          display: flex; gap: 8px; padding: 4px 20px 8px;
          flex-wrap: wrap;
        }
        .pc-reaction-pill {
          display: flex; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 99px;
          padding: 3px 10px;
          font-size: 13px; color: #9a9daa;
          cursor: pointer; transition: all 0.15s;
        }
        .pc-reaction-pill.active { background: rgba(255,165,80,0.15); border-color: rgba(255,165,80,0.3); color: #ffaa44; }
        .pc-reaction-pill:hover { background: rgba(255,255,255,0.09); }

        /* ── Divider ─────────────────────────────────── */
        .pc-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }

        /* ── Comments ────────────────────────────────── */
        .pc-comments-section { padding: 0 20px 4px; }
        .pc-comment-toggle {
          font-size: 13px; color: #6b6f7e; cursor: pointer;
          background: none; border: none; padding: 6px 0;
          font-family: 'DM Sans', sans-serif;
          transition: color 0.15s;
        }
        .pc-comment-toggle:hover { color: #ffaa44; }
        .pc-comment-list { display: flex; flex-direction: column; gap: 10px; padding: 10px 0; }
        .pc-comment {
          display: flex; gap: 10px; align-items: flex-start;
          animation: fadeUp 0.2s ease both;
        }
        .pc-comment-av {
          width: 30px; height: 30px; border-radius: 50%;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .pc-comment-bubble {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 8px 12px; flex: 1;
        }
        .pc-comment-user { font-size: 12px; font-weight: 500; color: #f0ece4; margin: 0 0 2px; }
        .pc-comment-text { font-size: 13px; color: #9a9daa; margin: 0; line-height: 1.5; }
        .pc-comment-time { font-size: 11px; color: #4a4e5c; margin-top: 4px; }

        .pc-comment-input-row {
          display: flex; gap: 8px; padding: 8px 0 4px;
          align-items: center;
        }
        .pc-comment-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 99px; padding: 9px 16px;
          font-size: 13px; color: #e0ddd8;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s;
        }
        .pc-comment-input::placeholder { color: #4a4e5c; }
        .pc-comment-input:focus { border-color: rgba(255,165,80,0.35); }
        .pc-send-btn {
          background: rgba(255,165,80,0.15);
          border: 1px solid rgba(255,165,80,0.3);
          color: #ffaa44; border-radius: 99px;
          padding: 9px 16px; font-size: 13px;
          cursor: pointer; transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .pc-send-btn:hover { background: rgba(255,165,80,0.25); }

        /* ── AI Section ──────────────────────────────── */
        .pc-ai-section {
          margin: 8px 20px 20px;
          background: rgba(99,102,241,0.07);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 16px;
          padding: 16px;
        }
        .pc-ai-label {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 500;
          color: #8b8ff0; letter-spacing: 0.08em;
          text-transform: uppercase; margin: 0 0 10px;
        }
        .pc-ai-label svg { width: 14px; height: 14px; }
        .pc-ai-row { display: flex; gap: 8px; align-items: center; }
        .pc-ai-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 99px; padding: 9px 16px;
          font-size: 13px; color: #e0ddd8;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s;
        }
        .pc-ai-input::placeholder { color: #4a4e5c; }
        .pc-ai-input:focus { border-color: rgba(99,102,241,0.4); }
        .pc-listen-btn {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.12);
          border: 1px solid rgba(99,102,241,0.3);
          color: #8b8ff0; cursor: pointer;
          transition: all 0.18s; flex-shrink: 0;
        }
        .pc-listen-btn:hover { background: rgba(99,102,241,0.22); }
        .pc-listen-btn.active { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.4); color: #f87171; animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } }
        .pc-ask-btn {
          padding: 9px 18px; border-radius: 99px;
          background: rgba(99,102,241,0.2);
          border: 1px solid rgba(99,102,241,0.35);
          color: #a5a8f5; font-size: 13px;
          cursor: pointer; transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .pc-ask-btn:hover:not(:disabled) { background: rgba(99,102,241,0.3); }
        .pc-ask-btn:disabled { opacity: 0.5; cursor: default; }
        .pc-ai-result {
          margin-top: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 12px 14px;
          font-size: 13px; line-height: 1.7;
          color: #c8c4bc;
          animation: fadeUp 0.25s ease both;
        }
        .pc-ai-typing {
          display: flex; gap: 5px; align-items: center;
          padding: 6px 2px;
        }
        .pc-ai-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #8b8ff0;
          animation: bounce 0.9s infinite;
        }
        .pc-ai-dot:nth-child(2) { animation-delay: 0.15s; }
        .pc-ai-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>

      <div className="pc-wrap">
        <div className="pc-card">

          {/* ── Header ── */}
          <div className="pc-header">
            <div className="pc-author">
              
                  <DisplayDp userId={post.author.id} />
              <div>
                <p className="pc-name">
                  {post.author.name}
                </p>
                <p className="pc-meta">@{post.author.username} · {post.timestamp}</p>
              </div>
            </div>
            <button
              className={`pc-follow-btn ${followed === "followed" || followed === "requested" ? "unfollow" : "follow"}`}
              onClick={handleFollowClick}
            >
              {getFollowLabel()}
            </button>
          <Bookmark size = {24} onClick={() => adding_removing_bookmark()} fill = {isbookmark ? "currentColor" : "none"} style={{cursor: 'pointer'}} />
          </div>

          {/* ── Text Content ── */}
          {/* ── Post Content ── */}
<div
  className="pc-text"
  dangerouslySetInnerHTML={{
    __html: post.content.text
  }}
/>

{/* ── Images ── */}
{post.content.images?.length > 0 && (
  <div className="pc-images">
    <img
      src={post.content.images[activeImage]}
      alt="Post"
      className="pc-img"
    />

    {post.content.images.length > 1 && (
      <>
        <button
          className="pc-img-nav pc-img-prev"
          onClick={() =>
            setActiveImage(
              (p) =>
                (p - 1 + post.content.images.length) %
                post.content.images.length
            )
          }
        >
          ‹
        </button>

        <button
          className="pc-img-nav pc-img-next"
          onClick={() =>
            setActiveImage(
              (p) => (p + 1) % post.content.images.length
            )
          }
        >
          ›
        </button>

        <div className="pc-img-dots">
          {post.content.images.map((_, i) => (
            <div
              key={i}
              className={`pc-dot ${
                i === activeImage ? "active" : ""
              }`}
              onClick={() => setActiveImage(i)}
            />
          ))}
        </div>
      </>
    )}
  </div>
)}

          {/* ── Stars ── */}
          <div className="pc-stars" title="Rate this post">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`pc-star ${s <= post.rating ? "lit" : ""}`}>★</span>
            ))}
          </div>

          {/* ── Action Buttons ── */}
          <div className="pc-actions">
            <button className={`pc-action-btn ${liked ? "liked" : ""}`} onClick={toggleLike}>
              <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {likeCount}
            </button>

            <button className="pc-action-btn" onClick={() => setShowComments((p) => !p)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {comments.length}
            </button>

            <div className="pc-reaction-wrap">
              <button className={`pc-action-btn ${pickedReaction ? "liked" : ""}`} onClick={() => setShowReactions((p) => !p)}>
                {pickedReaction || (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                )}
                React
              </button>
              {showReactions && (
                <div className="pc-reaction-picker">
                  {REACTION_LIST.map((e) => (
                    <button key={e} className="pc-emoji-btn" onClick={() => pickReaction(e)}>{e}</button>
                  ))}
                </div>
              )}
            </div>

            <button className="pc-action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              {post.stats.shares}
            </button>
          </div>

          {/* ── Reactions Row ── */}
          {Object.entries(reactions).some(([, v]) => v > 0) && (
            <div className="pc-reactions-row">
              {Object.entries(reactions).filter(([, v]) => v > 0).map(([emoji, count]) => (
                <div key={emoji} className={`pc-reaction-pill ${pickedReaction === emoji ? "active" : ""}`} onClick={() => pickReaction(emoji)}>
                  {emoji} {count}
                </div>
              ))}
            </div>
          )}

          <div className="pc-divider" />

          {/* ── Comments ── */}
          <div className="pc-comments-section">
            <button className="pc-comment-toggle" onClick={() => setShowComments((p) => !p)}>
              {showComments ? "▲ Hide comments" : `▼ See ${comments.length} comments`}
            </button>

            {showComments && (
              <div className="pc-comment-list">
                {comments.map((c) => (
                  <div key={c.id} className="pc-comment">
                    <img src={c.avatar} alt={c.user} className="pc-comment-av" />
                    <div className="pc-comment-bubble">
                      <p className="pc-comment-user">{c.user}</p>
                      <p className="pc-comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pc-comment-input-row">
              <input
                className="pc-comment-input"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
              />
              <button className="pc-send-btn" onClick={submitComment}>Send</button>
            </div>
          </div>

          <div className="pc-divider" />

          {/* ── AI Section ── */}
          <div className="pc-ai-section">
            <p className="pc-ai-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              </svg>
              Ask AI about this post
            </p>
            <div className="pc-ai-row">
              <input
                className="pc-ai-input"
                placeholder="What do you want to know…"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              />
              <button
                className={`pc-listen-btn ${listening ? "active" : ""}`}
                onClick={toggleListen}
                title={listening ? "Stop listening" : "Speak your question"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
              <button className="pc-ask-btn" onClick={handleAsk} disabled={aiLoading || !aiQuery.trim()}>
                {aiLoading ? "…" : "Ask ↗"}
              </button>
            </div>

            {aiLoading && (
              <div className="pc-ai-result">
                <div className="pc-ai-typing">
                  <div className="pc-ai-dot" /><div className="pc-ai-dot" /><div className="pc-ai-dot" />
                </div>
              </div>
            )}
            {aiResult && !aiLoading && (
              <div className="pc-ai-result">{aiResult}</div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
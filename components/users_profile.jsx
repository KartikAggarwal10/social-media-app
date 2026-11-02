import React, { useState ,useEffect,useRef,useCallback} from "react";
import {
  Heart,
  MessageCircle,
  LayoutGrid,
  UserPlus,
  Check,
  Send,
  Calendar,
  LogOut,
  FilePenLine,
} from "lucide-react";
import {getUser,giveUserPost,getUserBookmarksPaginationAction, sendFollowRequestAction, takeBackFollowRequestAction} from "../app/actions/users";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ChangeDpModal from "./change_dp";
import GetBioModal from "./get_bio";
/**
 * UserDisplay — public profile page for a post-making platform.
 *
 * Schema mapping to your user object:
 *   posts.length      -> "Posts" count
 *   followers.length  -> "Followers" count
 *   followed.length   -> "Following" count    (the array of people THIS user follows)
 *   likes             -> posts this user has liked on other people's posts
 *   comments          -> comments this user has left on other people's posts
 *   request_sent / request_came are modeled below as a simple private-account
 *   follow flow (none -> requested -> following) so you can see where they'd plug in.
 *
 * Fields used here that AREN'T in your current schema yet, added because they
 * make the page feel complete — safe to skip if you don't want them:
 *   bio, joinedOn, isPrivate, and (post.caption/likeCount/commentCount/image),
 *   plus authorName/snippet on each likes/comments entry.
 */


const PALETTE = ["#3D3358", "#B9873C", "#5B6B4F", "#8A4B3D"];

const DEMO_USER = {
  userId: 1,
  userName: "Meera Kapoor",
  handle: "meerak",
  email: "meera@example.com",
  dp: null,
  bio: "Design notes, half-finished thoughts, and the occasional recipe.",
  joinedOn: "March 2024",
  isPrivate: false,
  posts: [
    { id: 1, caption: "Rainy afternoons and cold coffee.", likeCount: 128, commentCount: 14 },
    { id: 2, caption: "New desk setup, finally done.", likeCount: 94, commentCount: 6 },
    { id: 3, caption: "Three years of this sketchbook.", likeCount: 201, commentCount: 22 },
    { id: 4, caption: "Sunday market haul.", likeCount: 67, commentCount: 3 },
    { id: 5, caption: "Trying film photography again.", likeCount: 156, commentCount: 11 },
    { id: 6, caption: "Unpopular opinion: samosas > momos.", likeCount: 312, commentCount: 41 },
  ],
  followers: Array.from({ length: 1240 }),
  followed: Array.from({ length: 318 }),
  likes: [
    { postId: 101, authorName: "Arjun Rao", snippet: "Finally fixed the leaky tap myself." },
    { postId: 102, authorName: "Divya Nair", snippet: "First trek of the season 🏔️" },
  ],
  comments: [
    { postId: 103, authorName: "Kabir Singh", snippet: "Launched the side project today.", commentText: "This looks so clean, well done!" },
    { postId: 104, authorName: "Naina Joshi", snippet: "Painted the hallway this weekend.", commentText: "That colour is gorgeous, what's it called?" },
  ],
};



function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
function useInfiniteScroll(loading, hasMore, onLoadMore) {
  const observer = useRef();

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  return lastElementRef;
}

// 


// complete complete part


// 


export default function UserDisplay({authorId}) {
  const [activeTab, setActiveTab] = useState("posts");
  const [followState, setFollowState] = useState("none"); // none | requested | following
  const [hasmore, sethasmore] = useState(true);
  const [page_no, set_page_no] = useState(1);
  const [post, setpost] = useState([]);
  const [loading, setloading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter()
  const {userId} = useAuth()
  const[click,setClick] = useState(false)
  const[changeBioPage,setChangeBioPage] = useState(false);
  const lastUserElementRef = useInfiniteScroll(loading, hasmore, () => {
    set_page_no(prev => prev + 1);
  });

  

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await getUser(authorId);
        setUser(fetchedUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    if (authorId !== null && authorId !== undefined) {
      fetchUser();
    }
  }, [authorId]);

  useEffect(() => {
    const fetchPosts = async () => {
      setloading(true);
      try {
        const data = await giveUserPost( page_no, 10);
        if (data.posts.length === 0) {
          sethasmore(false);
        } else {
          setpost((prev) => [...prev, ...data.posts]);
          sethasmore(data.hasMore);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setloading(false);
      }
    };
    if (hasmore && authorId !== null && authorId !== undefined) {
      fetchPosts();
    }
  }, [page_no, authorId, hasmore]);

  if (!user) {
    return <div className="udp-root"><div className="udp-shell">Loading profile...</div></div>;
  }

  const followersCount = user.followers?.length ?? 0;
  const followingCount = user.followed?.length ?? 0;
  const postsCount = user.posts?.length ?? 0;
  const activity = [
    ...(user.likes || []).map((l) => ({ ...l, kind: "like" })),
    ...(user.comments || []).map((c) => ({ ...c, kind: "comment" })),
  ];

async function handleFollowClick(usertosendrequest) {
  // 1. Calculate the next state synchronously based on the current state variable
  let next;
  if (followState === "following") next = "none";
  else if (followState === "requested") next = "none";
  else next = user.isPrivate ? "requested" : "following";

  // 2. Update the UI immediately (Optimistic Update)
  setFollowState(next);

  // 3. Perform the async database actions
  try {
    if (next === "requested" || next === "following") {
      await sendFollowRequestAction(usertosendrequest);
    } else {
      await takeBackFollowRequestAction(usertosendrequest);
    }
  } catch (error) {
    console.error("Action failed:", error);
    // Optional: Revert setFollowState to its previous value here if the API fails
  }
}

  const followLabel =
    followState === "following" ? "Following" : followState === "requested" ? "Requested" : "Follow";

  return (
    <div className="udp-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,340..600;1,9..144,400..500&family=Work+Sans:wght@400;500;600&display=swap');

        .udp-root {
          --paper: #F1ECE2;
          --surface: #FAF7F1;
          --ink: #24211D;
          --ink-soft: #726C5E;
          --line: #DED5C2;
          --plum: #3D3358;
          --plum-tint: #EAE6F0;
          --gold: #B9873C;
          --rose: #9C5644;
          font-family: 'Work Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          padding: 40px 20px 80px;
          display: flex;
          justify-content: center;
        }
        .udp-shell { width: 100%; max-width: 720px; }

        .udp-band {
          height: 84px;
          border-radius: 14px 14px 0 0;
          background-image: radial-gradient(var(--line) 1px, transparent 1px);
          background-size: 14px 14px;
          background-color: var(--surface);
          border: 1px solid var(--line);
          border-bottom: none;
        }

        .udp-header {
          background: var(--surface);
          border: 1px solid var(--line);
          border-top: none;
          border-radius: 0 0 14px 14px;
          padding: 0 28px 26px;
        }

        .udp-toprow {
          display: flex;
          align-items: flex-end;
          gap: 18px;
          margin-top: -38px;
        }

        .udp-avatar {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          border: 4px solid var(--surface);
          background: linear-gradient(135deg, var(--plum), var(--rose));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Fraunces', serif;
          font-size: 26px;
          font-weight: 500;
          flex-shrink: 0;
          overflow: hidden;
        }
        .udp-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .udp-nameblock { flex: 1; padding-bottom: 4px; min-width: 0; }
        .udp-name {
          font-family: 'Fraunces', serif;
          font-size: 30px;
          font-weight: 500;
          line-height: 1.1;
          margin: 0;
        }
        .udp-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--ink-soft);
          font-size: 13.5px;
          margin-top: 4px;
        }
        .udp-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: var(--ink-soft); }

        .udp-actions { display: flex; gap: 8px; padding-bottom: 4px; flex-shrink: 0; }
        .udp-btn {
          border-radius: 999px;
          padding: 9px 18px;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Work Sans', sans-serif;
          border: 1px solid var(--ink);
          background: transparent;
          color: var(--ink);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
        }
        .udp-btn:hover { opacity: 0.75; }
        .udp-btn:focus-visible { outline: 2px solid var(--plum); outline-offset: 2px; }
        .udp-btn--primary { background: var(--ink); color: var(--surface); }
        .udp-btn--muted { border-color: var(--line); color: var(--ink-soft); background: var(--paper); }

        .udp-bio {
          font-family: 'Fraunces', serif;
          font-style: italic;
          font-size: 16px;
          line-height: 1.5;
          color: var(--ink);
          margin: 18px 0 0;
          max-width: 56ch;
        }

        .udp-stats { display: flex; gap: 22px; margin-top: 20px; }
        .udp-stat { background: none; border: none; padding: 0; cursor: default; text-align: left; }
        .udp-stat + .udp-stat { padding-left: 22px; border-left: 1px solid var(--line); }
        .udp-stat-num { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 500; display: block; }
        .udp-stat-label { font-size: 12.5px; color: var(--ink-soft); }

        .udp-tabs {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          margin-top: 32px;
          border-bottom: 1px solid var(--line);
        }
        .udp-tab {
          background: none;
          border: none;
          padding: 12px 4px;
          font-family: 'Work Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 500;
          color: var(--ink-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
        }
        .udp-tab[aria-selected="true"] { color: var(--ink); }
        .udp-tab:focus-visible { outline: 2px solid var(--plum); outline-offset: -2px; }
        .udp-indicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 50%;
          height: 2px;
          background: var(--plum);
          transition: transform 0.25s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .udp-indicator, .udp-btn { transition: none; }
        }

        .udp-panel { padding-top: 22px; }

        .udp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 14px;
        }
        .udp-post {
          border: 1px solid var(--line);
          border-radius: 10px;
          overflow: hidden;
          background: var(--surface);
        }
        .udp-post-swatch {
          height: 120px;
          display: flex;
          align-items: flex-end;
          padding: 10px;
        }
        .udp-post-caption {
          padding: 10px 12px 12px;
          font-size: 13px;
          line-height: 1.4;
          color: var(--ink);
        }
        .udp-post-meta {
          display: flex;
          gap: 12px;
          padding: 0 12px 12px;
          font-size: 12px;
          color: var(--ink-soft);
        }
        .udp-post-meta span { display: inline-flex; align-items: center; gap: 4px; }

        .udp-activity-row {
          display: flex;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--line);
        }
        .udp-activity-row:last-child { border-bottom: none; }
        .udp-activity-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .udp-activity-icon--like { background: #F3E7DD; color: var(--gold); }
        .udp-activity-icon--comment { background: #F1E4DE; color: var(--rose); }
        .udp-activity-text { font-size: 14px; line-height: 1.5; }
        .udp-activity-text b { font-weight: 600; }
        .udp-activity-quote {
          font-family: 'Fraunces', serif;
          font-style: italic;
          color: var(--ink-soft);
        }

        .udp-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--ink-soft);
          font-size: 14px;
        }
      `}</style>

      <div className="udp-shell">
        <div className="udp-band" />
        <div className="udp-header">
          <div className="udp-toprow">
            <div className="udp-avatar">
              {user.dp ? <img src={user.dp} alt="" onClick={() => setClick(true)} /> : initials(user.userName)}
              {
                click && (
                  <ChangeDpModal isOpen = {true} onClose = {() => setClick(false)} />
                )
              }
            </div>
            <div className="udp-nameblock">
              <h1 className="udp-name">{user.userName}</h1>
              <div className="udp-meta">
                <span>@{user.handle || user.userName?.toLowerCase().replace(/\s+/g, "")}</span>
                {user.joinedOn && (
                  <>
                    <span className="dot" />
                    <Calendar size={12} />
                    <span>Joined {user.joinedOn}</span>
                  </>
                )}
              </div>
            </div>
            <div className="udp-actions">
              {authorId !== userId ? <button
                className={`udp-btn ${followState === "following" ? "udp-btn--muted" : followState === "requested" ? "udp-btn--muted" : "udp-btn--primary"}`}
                onClick={() => handleFollowClick(authorId)}
              >
                {followState === "following" ? <Check size={15} /> : followState === "none" ? <UserPlus size={15} /> : null}
                {followLabel}
              </button> : <button onClick={() => router.replace("/logout")}> <LogOut/> </button>}
              <button className="udp-btn">
  {authorId !== userId ? (
    <Link href={`/chat/${authorId}`}>
      <Send size={14} />
      Message
    </Link>
  ) : (
    <div onClick={() => setChangeBioPage(true)}>
      Edit Bio
    </div>
  )}
</button>
            </div>
          </div>

          {user.bio && <p className="udp-bio">{user.bio}</p>}
          {changeBioPage && (<GetBioModal isOpen = {true} onClose = {() => setChangeBioPage(false)} />)}

          <div className="udp-stats">
            <div className="udp-stat">
              <span className="udp-stat-num">{formatCount(postsCount)}</span>
              <span className="udp-stat-label">Posts</span>
            </div>
            <div className="udp-stat">
              <span className="udp-stat-num">{formatCount(followersCount)}</span>
              <span className="udp-stat-label">Followers</span>
            </div>
            <div className="udp-stat">
              <span className="udp-stat-num">{formatCount(followingCount)}</span>
              <span className="udp-stat-label">Following</span>
            </div>
          </div>

          <div className="udp-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "posts"}
              className="udp-tab"
              onClick={() => setActiveTab("posts")}
            >
              <LayoutGrid size={15} />
              Posts
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "activity"}
              className="udp-tab"
              onClick={() => setActiveTab("activity")}
            >
              <Heart size={15} />
              Likes &amp; comments
            </button>
            <div
              className="udp-indicator"
              style={{ transform: `translateX(${activeTab === "posts" ? "0" : "100%"})` }}
            />
          </div>
        </div>

        <div className="udp-panel">
          {activeTab === "posts" ? (
            postsCount === 0 ? (
              <div className="udp-empty">No posts yet.</div>
            ) : (
              <div className="udp-grid">
                {post.map((p, i) =>{
                const last_element = post.length === i+1; 
                return (
                  <div className="udp-post" ref={last_element ? lastUserElementRef : null} key={p.id ?? i}>
                    <div
                      className="udp-post-swatch"
                      style={{
                        background: `linear-gradient(135deg, ${PALETTE[i % PALETTE.length]}, ${PALETTE[(i + 1) % PALETTE.length]})`,
                      }}
                    />
                    <div className="udp-post-caption" onClick={() => router.push(`Postprticulr/${p.postId}`)} >{p.title || "Untitled post"}</div>
                    <div className="udp-post-meta">
                      <span><MessageCircle size={12} />{formatCount(p.commentCount ?? 0)}</span>
                    </div>
                  </div>
                )})}
              </div>
            )
          ) : activity.length === 0 ? (
            <div className="udp-empty">Nothing here yet — likes and comments on other people's posts will show up here.</div>
          ) : (
            <div>
              {activity.map((entry, i) => (
                <div className="udp-activity-row" key={i}>
                  <div className={`udp-activity-icon udp-activity-icon--${entry.kind}`}>
                    {entry.kind === "like" ? <Heart size={15} fill="currentColor" /> : <MessageCircle size={15} />}
                  </div>
                  <div className="udp-activity-text">
                    {entry.kind === "like" ? (
                      <>Liked a post by <b>{entry.authorName}</b> — <span className="udp-activity-quote">"{entry.snippet}"</span></>
                    ) : (
                      <>
                        Commented on <b>{entry.authorName}</b>'s post <span className="udp-activity-quote">"{entry.snippet}"</span>
                        <div style={{ marginTop: 4, color: "var(--ink-soft)" }}>"{entry.commentText}"</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
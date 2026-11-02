// Create this in your components folder or as a page (e.g., app/network/page.jsx)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getNetworkAction, cancelFollowAction ,sendFollowRequestAction,sendUsersRequested} from "../app/actions/users"; // Adjust path if needed
import {useRouter}  from "next/navigation"
import { useAuth } from "../context/AuthContext";
export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState("followers"); // 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter()
  const observer = useRef();
  const {userId} = useAuth()
  const[request_sent,setRequest_sent] = useState([])
  // This detects when we scroll to the last user in the list
  const currentUserId = userId
  const lastUserElementRef = useCallback((node) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => { //IntersectionObserver is a browser API that can tell you: "Is this element currently visible on the screen?"
      // If the last element is visible and we have more data, load next page
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch the users when the page number or tab changes
  useEffect(() => {
    const fxn= async () => {
      const data = await sendUsersRequested(userId)
        setRequest_sent(data)
    }
    fxn()
  },[])
  useEffect(() => {
    if (currentUserId === null || currentUserId === undefined) return;
    
    // Create a local variable so we don't rely purely on state which might be stale
    let isActive = true;
    const fetchUsers = async () => {
      console.log("cme" + currentUserId);
      setLoading(true);
      try {
        const newUsers = await getNetworkAction(activeTab, page, 10); 
        if(newUsers.length == 0) console.log("no user foud")
        newUsers.forEach(element => {
          console.log("newUsers -> " +element)
        });
        if (newUsers.length === 0) {
          setHasMore(false); // No more users left to load
        } else { 
          setUsers(prev => {
            // Prevent duplicates when React renders twice in dev mode
            const existingIds = new Set(prev.map(u => u.userId));
            const filteredNew = newUsers.filter(u => !existingIds.has(u.userId));
            return [...prev, ...filteredNew];
          });
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (hasMore) {
      fetchUsers();
    }
  }, [activeTab, page, currentUserId]);

  // Unfollow handler
  const handleUnfollow = async (targetUserId) => {
    // 1. Instantly remove from UI for good user experience
    setUsers(prev => prev.filter(u => u.userId !== targetUserId));
    
    // 2. Perform the server action
    // "unfollow" removes target from your following list
    await cancelFollowAction(targetUserId,  "unfollow"); 
  };
  const followfunction = async (targetUserId) => {
    if (request_sent.includes(targetUserId)) return;
    setRequest_sent(prev => [...prev,targetUserId])
      await sendFollowRequestAction(targetUserId,userId)
  }
  return (
    <div className="max-w-2xl mx-auto p-5 bg-[#071126] min-h-screen text-white">
      {/* --- Top Header Tabs --- */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
        <button 
          onClick={() => {
            if (activeTab !== "followers") {
              setActiveTab("followers");
              setUsers([]);
              setPage(1);
              setHasMore(true);
            }
          }}
          className={`flex-1 pb-2 font-bold transition-colors ${activeTab === 'followers' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'}`}
        >
          Followers
        </button>
        <button 
          onClick={() => {
            if (activeTab !== "following") {
              setActiveTab("following");
              setUsers([]);
              setPage(1);
              setHasMore(true);
            }
          }}
          className={`flex-1 pb-2 font-bold transition-colors ${activeTab === 'following' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'}`}
        >
          Following
        </button>
      </div>

      {/* --- User List with Lazy Loading --- */}
      <div className="flex flex-col gap-4">
        {users.map((user, index) => {
          // Identify if this is the last element to attach the observer
          const isLast = users.length === index + 1;
          
          return (
            <div 
              key={user.userId} 
              ref={isLast ? lastUserElementRef : null}
              className="flex items-center justify-between p-4 bg-[#111827] border border-white/5 rounded-2xl transition hover:border-white/10 shadow-sm"
              
            >
              {/* User Info */}
              <div className="flex items-center gap-4" onClick={() => router.replace(`profile/${user.userId}`)}>
                <img 
                  src={user.dp || "/user.png"} 
                  alt={user.userName} 
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
                <span className="font-semibold text-lg">{user.userName}</span>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                {activeTab === "followers" && (
                  <button 
                    onClick={() => router.replace(`/chat/${user.userId}`)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition shadow-md shadow-violet-900/20"
                  >
                    Chat
                  </button>
                )}
                {activeTab === "following" && (
                <button 
                  onClick={() => handleUnfollow(user.userId)}
                  className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl text-sm font-semibold transition border border-red-500/20"
                >
                  Unfollow
                </button>)}

                {activeTab === "followers" && (
                  <button 
                    onClick={() => followfunction(user.userId)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-semibold transition shadow-md shadow-violet-900/20"
                  >
                    {request_sent.includes(user.userId) ? <div>request sent...</div> : <div>follow</div> }
                  </button>
                )}

              </div>
            </div>
          );
        })}

        {/* --- Loading & Empty States --- */}
        {loading && (
          <div className="text-center py-4 text-violet-400 animate-pulse font-medium">
            Loading...
          </div>
        )}
        
        {!loading && !hasMore && users.length > 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            You've reached the end of the list.
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No {activeTab} found.
          </div>
        )}
      </div>
    </div>
  );
}
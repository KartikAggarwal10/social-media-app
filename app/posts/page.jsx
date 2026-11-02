// "use client";

// import DashboardPage from "@/components/posts/llposts";
// import { useAuth } from "../../context/AuthContext";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";

// export default function Postspage() {
//   console.log("came in get all posts page");
//   const { userId, loading } = useAuth();
//   console.log("next step");
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && (userId === null || userId === undefined)) {
//       router.push("/login");
//     }
//   }, [userId, loading, router]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
//         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
//       </div>
//     );
//   }

//   if (userId === null || userId === undefined) {
//     return null;
//   }

//   return <DashboardPage />;
// }

"use client";

import DashboardPage from "@/components/posts/llposts";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Postspage(props) { // 1. Accept props here
  console.log("came in get all posts page");
  const { userId, loading } = useAuth();
  console.log("next step");
  const router = useRouter();

  useEffect(() => {
    if (!loading && (userId === null || userId === undefined)) {
      router.push("/login");
    }
  }, [userId, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  if (userId === null || userId === undefined) {
    return null;
  }

  return <DashboardPage {...props} />; // 2. Spread props down to DashboardPage
}
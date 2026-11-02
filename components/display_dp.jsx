"use client"
import { useAuth } from "@/context/AuthContext";
import { useEffect,useState } from "react";
import { getDp } from "../app/actions/users";
import Image from "next/image";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
export default function DisplayDp({userId}) {
     const[dp,setdp] = useState();
     const router =useRouter()
     const[zoom,setzoom] = useState(false)
     useEffect(() => {
        async function get() {
    console.log("getting")
            const x = await getDp(userId)
            setdp(x)
            console.log(x);
        }
        get()
     },[userId])
     return (
        <div>
       {dp ? (
        <Image
          src={dp}
          alt="profile"
          width={48}
          height={48}
          className="rounded-full border-2 border-violet-500"
          onClick={() => router.replace(`/profile/${userId}`)}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-700 animate-pulse" />
      )}
      {dp && zoom &&(
        <div>
            <button onClick={() => setzoom(false)}>
                <X size={10} />
            </button>
            <Image
          src={dp}
          alt="profile"
          width={500}
          height={500}
          className="rounded-full border-2 border-violet-500"
          onClick={() => setzoom(true)}
        />
        </div>
      )}
      </div>
     )
}
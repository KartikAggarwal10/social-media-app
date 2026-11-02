'use client'
import { useState } from "react"
export default function GenrteSpeech(){
    const[dt,sdt] = useState("")
    async function hndlesub(e){
        e.preventDefault();
        const xx = await fetch("/api/genertespeech",{
            method:"POST",
            headers:{"Content-type":"application/json"},
            body : JSON.stringify({dt})
        })
        const xy = await xx.blob()
        const ur = URL.createObjectURL(xy);
        const dio = new Audio(ur)
        dio.play() 
        dio.addEventListener("ended",()=>{
            URL.revokeObjectURL(ur)
        })
    }
    return(
        <div>
            <form onSubmit={hndlesub} >
                <input type="text" onChange={(e)=>{sdt(e.target.value)}} />
                <button type="submit" >genrte</button>
            </form>
        </div>
    )
}
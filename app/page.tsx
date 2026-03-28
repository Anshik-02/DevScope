"use client"
import { useState } from "react";
import axios from "axios"

export default function Home() {
const [link,setLink]=useState("")

const changeHandler=(e)=>{
e.preventDefault()
const {value}=e.target
setLink(value)

}
 
const submitHandler=async()=>{
  
console.log(link)
const res=await axios.post("/api/analyse",{link})
console.log(res.data)

}
  return (
   <div>

  
<input
onChange={changeHandler}
value={link}
 placeholder="input the repo"></input>
<button onClick={submitHandler}>submit</button>
 </div>
  );
}

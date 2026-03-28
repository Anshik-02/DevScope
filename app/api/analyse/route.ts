import { NextResponse } from "next/server";

export async function POST(req:Request){

try{

    const {link}=await req.json()

    console.log(link)
    return new NextResponse("maza aagya bhaii")
}
catch(e){
    return new NextResponse("smasya")
}

}
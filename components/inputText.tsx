"use client";
import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import axios from "axios";

const Inputt = () => {
  const changeHandler = (e: any) => {
    const { value } = e.target;
    e.preventDefault();
    setLink(value);
  };

  const submitHandler = async () => {
    setLoading(true);
    console.log(link);
    const res = await axios.post("/api/analyse", { link });
    console.log(res.data);
    if (res.data) setLoading(false);
  };

  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex gap-4 items-center w-screen">
      <Input
        placeholder="Enter the repo"
        onChange={changeHandler}
        value={link}
        className="w-80"
      />
      <Button onClick={submitHandler}>
        {loading ? "Analysing" : "Analyse"}
      </Button>
    </div>
  );
};

export default Inputt;

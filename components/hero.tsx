import React from "react";

const Hero = () => {
  return (
    <div className="flex flex-col items-center w-screen justify-center mt-10">
      <p className="rounded-md border-2 w-90 text-center text-purple-800 text-xl">
        Intelligence Powered Analysis Core
      </p>
      <div className="flex flex-wrap">
        <h1 className="text-[90px] font-bold text-center  bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
          MAP THE <br />
          NEURAL NET
        </h1>
      </div>
      <p className="text-2xl text-center">DevScope clarifies complex architecture into narrative driven, <br />interactive execution maps in seconds </p>
    </div>
  );
};

export default Hero;

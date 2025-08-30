'use client';
import React from "react";
import Spline from "@splinetool/react-spline";

const Spline3D = () => {
  return (
      <div className="w-lg h-[300px]  max-sm:hidden">
      <Spline scene="https://prod.spline.design/5HD6STmWQnl4-J5G/scene.splinecode" />
    </div>
  );
};

export default Spline3D;

"use client";
import dynamic from "next/dynamic";
import React from "react";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
});

export default function Map({ points }: { points: any[] }) {
  return <LeafletMap points={points} />;
}

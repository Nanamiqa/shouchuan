import type { Metadata } from "next";
import { BraceletStudio } from "./BraceletStudio";

export const metadata: Metadata = {
  title: { absolute: "腕间 · 手串试戴" },
  description: "上传一张腕部照片，快速看看不同手串戴在自己手上的效果。",
};

export default function Home() {
  return <BraceletStudio />;
}

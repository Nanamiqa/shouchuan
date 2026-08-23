import type { Metadata } from "next";
import { BraceletStudio } from "./BraceletStudio";

export const metadata: Metadata = {
  title: { absolute: "腕间 · AI 配饰设计与手串试戴" },
  description: "上传实物珠子与配件，生成手串、手机链、项链设计；也可以上传腕部照片试戴和自由串珠。",
};

export default function Home() {
  return <BraceletStudio />;
}

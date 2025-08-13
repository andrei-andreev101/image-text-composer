"use client";

import dynamic from "next/dynamic";

// Client-only wrapper around the heavy editor
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

export default function EditorClient() {
  return <Editor />;
}


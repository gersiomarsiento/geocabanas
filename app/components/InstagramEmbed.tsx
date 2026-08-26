"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}

export default function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    // Multiple InstagramEmbed instances can render at once (grid/slider),
    // so only ever inject the script once and never remove it on unmount —
    // other embeds on the page may still depend on it.
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.instagram.com/embed.js"]',
    );

    if (existing) {
      window.instgrm?.Embeds.process();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm?.Embeds.process();
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    window.instgrm?.Embeds.process();
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{
        background: "#fff",
        border: 0,
        borderRadius: 3,
        boxShadow: "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
        margin: "1px",
        maxWidth: 540,
        minWidth: 326,
        padding: 0,
        width: "calc(100% - 2px)",
      }}
    />
  );
}

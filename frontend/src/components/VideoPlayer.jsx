import React, { useMemo } from 'react';
import { Play, Video as VideoIcon, Film } from 'lucide-react';

export function getEmbedInfo(url) {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // YouTube matchers (standard, short URL, shorts, embed)
  const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = cleanUrl.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      id: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0`,
    };
  }

  // Vimeo matchers
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/;
  const vimeoMatch = cleanUrl.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      id: vimeoMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
    };
  }

  // Direct HTML5 video file (.mp4, .webm, .mov, /uploads/videos/...)
  const isDirectVideo =
    /\.(mp4|webm|mov|ogg|m4v)($|\?)/i.test(cleanUrl) ||
    cleanUrl.includes('/uploads/videos/');

  if (isDirectVideo) {
    return {
      type: 'direct',
      url: cleanUrl,
    };
  }

  // Fallback as general video URL
  return {
    type: 'direct',
    url: cleanUrl,
  };
}

export default function VideoPlayer({ url, title = 'Cooking Video' }) {
  const embedInfo = useMemo(() => getEmbedInfo(url), [url]);

  if (!url || !embedInfo) return null;

  return (
    <div className="recipe-video-container">
      <div className="recipe-video-wrapper">
        {embedInfo.type === 'youtube' || embedInfo.type === 'vimeo' ? (
          <iframe
            src={embedInfo.embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="recipe-video-iframe"
          />
        ) : (
          <video
            controls
            playsInline
            preload="metadata"
            className="recipe-video-element"
            key={embedInfo.url}
          >
            <source src={embedInfo.url} type="video/mp4" />
            <source src={embedInfo.url} type="video/webm" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
}

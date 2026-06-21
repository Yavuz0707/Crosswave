import type { CSSProperties, ReactNode } from "react";

export interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

function Stroke({
  size = 18,
  color = "currentColor",
  strokeWidth = 2,
  className,
  style,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Stroke>
);

export const IconPlus = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Stroke>
);

export const IconUsers = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Stroke>
);

export const IconEye = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </Stroke>
);

export const IconTrendingUp = (p: IconProps) => (
  <Stroke {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </Stroke>
);

export const IconTrendingDown = (p: IconProps) => (
  <Stroke {...p}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </Stroke>
);

export const IconHeart = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </Stroke>
);

export const IconComment = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </Stroke>
);

export const IconBell = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Stroke>
);

export const IconFileText = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </Stroke>
);

export const IconCalendar = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </Stroke>
);

export const IconChevronDown = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m6 9 6 6 6-6" />
  </Stroke>
);

export const IconChevronRight = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m9 18 6-6-6-6" />
  </Stroke>
);

export const IconArrowLeft = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Stroke>
);

export const IconRefresh = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Stroke>
);

export const IconYouTube = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </Stroke>
);

export const IconSliders = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </Stroke>
);

export const IconCheck = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Stroke>
);

export const IconDownload = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <path d="M12 15V3" />
  </Stroke>
);

export const IconMore = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </Stroke>
);

export const IconInstagram = (p: IconProps) => (
  <Stroke {...p}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </Stroke>
);

export const IconTikTok = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M22 8a4 4 0 0 1-4-4 1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v11a3 3 0 1 1-4-2.83V9.05A7 7 0 1 0 16 16V9.27A7 7 0 0 0 22 11" />
  </Stroke>
);

export const IconLogOut = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </Stroke>
);

export const IconUser = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Stroke>
);

export const IconCreditCard = (p: IconProps) => (
  <Stroke {...p}>
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </Stroke>
);

export const IconInbox = (p: IconProps) => (
  <Stroke {...p}>
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Stroke>
);

export const IconAlert = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Stroke>
);

export const IconLink = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Stroke>
);

export const IconPlay = ({
  size = 12,
  color = "var(--bordeaux-700)",
  className,
  style,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke="none"
    className={className}
    style={{ marginLeft: 1, ...style }}
  >
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

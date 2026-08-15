import React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const HomeIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" />
  </svg>
);

export const TripIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 16V9a2 2 0 0 1 2-2h1l1.2-2.4A2 2 0 0 1 10 3.5h4a2 2 0 0 1 1.8 1.1L17 7h1a2 2 0 0 1 2 2v7" />
    <path d="M4 16h16" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="16.5" cy="17.5" r="1.8" />
    <path d="M7 10h10" />
  </svg>
);

export const FleetIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 17V9.5a1 1 0 0 1 .5-.87l7.5-4.3a1 1 0 0 1 1 0l7.5 4.3a1 1 0 0 1 .5.87V17" />
    <path d="M3 17h18" />
    <path d="M7 17v-4h10v4" />
    <path d="M9 13V9M15 13V9" />
  </svg>
);

export const ReportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 21V5a2 2 0 0 1 2-2h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    <path d="M14 3v4h4" />
    <path d="M8 17v-3M12 17v-6M16 17v-2" />
  </svg>
);

export const SupportIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="3" />
    <path d="m6.3 6.3 2.6 2.6M17.7 6.3l-2.6 2.6M6.3 17.7l2.6-2.6M17.7 17.7l-2.6-2.6" />
  </svg>
);

export const SettingsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1-1.55V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V10c.14.41.44.75.83.99.24.13.5.2.77.21H19.5a2 2 0 1 1 0 4h-.09c-.41 0-.8.24-1.01.5Z" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const PhoneIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 4h3.2l1.2 4.5-2 1.6a12 12 0 0 0 5.5 5.5l1.6-2 4.5 1.2V18a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2Z" />
  </svg>
);

export const PinIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
);

export const FlagIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 21V4" />
    <path d="M5 5h13l-3 4 3 4H5" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m4 12 6 6L20 6" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PlayIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 4 14 8-14 8V4Z" />
  </svg>
);

export const EditIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const DownloadIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3v13" />
    <path d="m7 11 5 5 5-5" />
    <path d="M4 20h16" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.7-3.3 3-5 5.5-5s4.8 1.7 5.5 5" />
    <circle cx="17" cy="8.5" r="2.5" />
    <path d="M16 14c2.2.2 3.8 1.8 4.3 4.2" />
  </svg>
);

export const ChevronIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const BuildingIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15" />
    <path d="M12 10h7a1 1 0 0 1 1 1v10" />
    <path d="M7 9h.01M7 13h.01M7 17h.01" />
    <path d="M15 14h.01M15 18h.01" />
    <path d="M2 21h20" />
  </svg>
);

export const BackupIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </svg>
);

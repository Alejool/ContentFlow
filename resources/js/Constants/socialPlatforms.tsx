import { CalendarIcon } from "lucide-react";
import React from "react";
import { FaFacebook, FaTiktok, FaTwitter, FaYoutube } from "react-icons/fa";

// Import SVG logos from the assets (based on existing paths in components)
import IconFacebook from "../../assets/Icons/facebook.svg";
import IconTiktok from "../../assets/Icons/tiktok.svg";
import IconTwitter from "../../assets/Icons/x.svg";
import IconYoutube from "../../assets/Icons/youtube.svg";

export interface SocialPlatformConfig {
  id: number;
  key: string;
  name: string;
  logo: string;
  icon: React.ComponentType<any>;
  color: string;
  textColor: string;
  borderColor: string;
  darkColor: string;
  darkTextColor: string;
  darkBorderColor: string;
  gradient: string;
  bgClass: string; // Tailwind background color class
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatformConfig> = {
  facebook: {
    id: 1,
    key: "facebook",
    name: "Facebook",
    logo: IconFacebook,
    icon: FaFacebook,
    color: "bg-blue-600",
    textColor: "text-blue-700",
    borderColor: "border-blue-100",
    darkColor: "dark:bg-blue-900/20",
    darkTextColor: "dark:text-blue-400",
    darkBorderColor: "dark:border-blue-900/30",
    gradient: "from-blue-500 to-blue-700",
    bgClass: "bg-blue-50",
  },
  // instagram: {
  //     id: 2,
  //     key: 'instagram',
  //     name: 'Instagram',
  //     logo: IconInstagram,
  //     icon: FaInstagram,
  //     color: 'bg-pink-600',
  //     textColor: 'text-pink-700',
  //     borderColor: 'border-pink-100',
  //     darkColor: 'dark:bg-pink-900/20',
  //     darkTextColor: 'dark:text-pink-400',
  //     darkBorderColor: 'dark:border-pink-900/30',
  //     gradient: 'from-pink-500 to-purple-700',
  //     bgClass: 'bg-pink-50',
  // },
  tiktok: {
    id: 3,
    key: "tiktok",
    name: "TikTok",
    logo: IconTiktok,
    icon: FaTiktok,
    color: "bg-black",
    textColor: "text-gray-700",
    borderColor: "border-gray-200",
    darkColor: "dark:bg-gray-800",
    darkTextColor: "dark:text-gray-300",
    darkBorderColor: "dark:border-gray-700",
    gradient: "from-neutral-900 via-neutral-800 to-rose-900",
    bgClass: "bg-gray-100",
  },
  twitter: {
    id: 4,
    key: "twitter",
    name: "Twitter",
    logo: IconTwitter,
    icon: FaTwitter,
    color: "bg-gray-900",
    textColor: "text-sky-700",
    borderColor: "border-sky-100",
    darkColor: "dark:bg-sky-900/20",
    darkTextColor: "dark:text-sky-400",
    darkBorderColor: "dark:border-sky-900/30",
    gradient: "from-neutral-800 to-neutral-900",
    bgClass: "bg-sky-50",
  },
  youtube: {
    id: 5,
    key: "youtube",
    name: "YouTube",
    logo: IconYoutube,
    icon: FaYoutube,
    color: "bg-primary-600",
    textColor: "text-red-700",
    borderColor: "border-red-100",
    darkColor: "dark:bg-red-900/20",
    darkTextColor: "dark:text-red-400",
    darkBorderColor: "dark:border-red-900/30",
    gradient: "from-primary-600 to-primary-800",
    bgClass: "bg-red-50",
  },
  // linkedin: {
  //     id: 6,
  //     key: 'linkedin',
  //     name: 'LinkedIn',
  //     logo: '', // LinkedIn logo not found in imports, using fallback if needed
  //     icon: FaLinkedin,
  //     color: 'bg-blue-700',
  //     textColor: 'text-blue-800',
  //     borderColor: 'border-blue-100',
  //     darkColor: 'dark:bg-blue-900/20',
  //     darkTextColor: 'dark:text-blue-300',
  //     darkBorderColor: 'dark:border-blue-900/30',
  //     gradient: 'from-blue-600 to-blue-800',
  //     bgClass: 'bg-blue-50',
  // }
};

export const getPlatformConfig = (platform: string): SocialPlatformConfig => {
  const key = platform.toLowerCase();
  const config =
    SOCIAL_PLATFORMS[key] || SOCIAL_PLATFORMS[key === "x" ? "twitter" : ""];

  if (config) return config;

  // Fallback config
  return {
    id: 0,
    key: "social",
    name: "Social",
    logo: "",
    icon: CalendarIcon,
    color: "bg-gray-500",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
    darkColor: "dark:bg-gray-800",
    darkTextColor: "dark:text-gray-400",
    darkBorderColor: "dark:border-gray-700",
    gradient: "from-gray-500 to-gray-700",
    bgClass: "bg-gray-50",
  };
};

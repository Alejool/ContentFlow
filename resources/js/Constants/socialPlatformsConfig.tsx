import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import IconFacebook from "../../assets/Icons/facebook.svg";
import IconInstagram from "../../assets/Icons/instagram.svg";
import IconTiktok from "../../assets/Icons/tiktok.svg";
import IconTwitter from "../../assets/Icons/x.svg";
import IconYoutube from "../../assets/Icons/youtube.svg";

export const SOCIAL_PLATFORMS = {
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
    maxVideoDuration: 14400, // 4 hours
    maxVideoCount: 10,
    active: true,
  },
  // instagram: {
  //   id: 2,
  //   key: "instagram",
  //   name: "Instagram",
  //   logo: IconInstagram,
  //   icon: FaInstagram,
  //   color: "bg-pink-600",
  //   textColor: "text-pink-700",
  //   borderColor: "border-pink-100",
  //   darkColor: "dark:bg-pink-900/20",
  //   darkTextColor: "dark:text-pink-400",
  //   darkBorderColor: "dark:border-pink-900/30",
  //   gradient: "from-pink-500 via-purple-500 to-orange-500",
  //   bgClass: "bg-pink-50",
  //   maxVideoDuration: 90, // 90 seconds for reels
  //   maxVideoCount: 1,
  //   active: true,
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
    maxVideoDuration: 600, // 10 minutes
    maxVideoCount: 1,
    active: true,
  },
  twitter: {
    id: 4,
    key: "twitter",
    name: "X",
    logo: IconTwitter,
    icon: FaXTwitter,
    color: "bg-gray-900",
    textColor: "text-gray-700",
    borderColor: "border-gray-100",
    darkColor: "dark:bg-gray-900/20",
    darkTextColor: "dark:text-gray-400",
    darkBorderColor: "dark:border-gray-900/30",
    gradient: "from-neutral-800 to-neutral-900",
    bgClass: "bg-gray-50",
    maxVideoDuration: 140, // 2m 20s for non-premium
    maxVideoCount: 4,
    active: true,
  },
  youtube: {
    id: 5,
    key: "youtube",
    name: "YouTube",
    logo: IconYoutube,
    icon: FaYoutube,
    color: "bg-red-600",
    textColor: "text-red-700",
    borderColor: "border-red-100",
    darkColor: "dark:bg-red-900/20",
    darkTextColor: "dark:text-red-400",
    darkBorderColor: "dark:border-red-900/30",
    gradient: "from-red-600 to-red-800",
    bgClass: "bg-red-50",
    maxVideoDuration: 43200, // 12 hours
    maxVideoCount: 1,
    active: true,
  },
  // linkedin: {
  //   id: 6,
  //   key: "linkedin",
  //   name: "LinkedIn",
  //   logo: IconInstagram, // Temporal, necesitas agregar el logo de LinkedIn
  //   icon: FaLinkedin,
  //   color: "bg-blue-700",
  //   textColor: "text-blue-800",
  //   borderColor: "border-blue-100",
  //   darkColor: "dark:bg-blue-900/20",
  //   darkTextColor: "dark:text-blue-400",
  //   darkBorderColor: "dark:border-blue-900/30",
  //   gradient: "from-blue-600 to-blue-800",
  //   bgClass: "bg-blue-50",
  //   maxVideoDuration: 600, // 10 minutes
  //   maxVideoCount: 1,
  //   active: false, // Desactivado por defecto hasta que esté completamente implementado
  // },
} as const;

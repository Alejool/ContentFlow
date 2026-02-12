import { CalendarIcon } from "lucide-react";
import React from "react";
import { SOCIAL_PLATFORMS as SOCIAL_PLATFORMS_DATA } from "./socialPlatformsConfig";

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
  bgClass: string;
  maxVideoDuration?: number;
  maxVideoCount?: number;
  active: boolean;
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatformConfig> =
  SOCIAL_PLATFORMS_DATA as any;

export const getPlatformConfig = (platform: string): SocialPlatformConfig => {
  const key = platform.toLowerCase();
  const config =
    SOCIAL_PLATFORMS[key] || SOCIAL_PLATFORMS[key === "x" ? "x" : ""];

  if (config) return config;

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
    active: true,
  };
};

export const getActivePlatformKeys = () => {
  return Object.values(SOCIAL_PLATFORMS)
    .filter((p) => p.active)
    .map((p) => p.key);
};

export const getPlatformOptions = () => {
  return Object.values(SOCIAL_PLATFORMS)
    .filter((p) => p.active)
    .map((p) => ({
      value: p.key,
      label: p.name,
    }));
};

import React from 'react';
import { getPlatformConfig } from '@/Constants/ConfigSocialMedia/socialPlatforms';

interface PlatformIconProps {
  platform: string;
  className?: string;
}

export const PlatformIcon = ({ platform, className = "h-4 w-4" }: PlatformIconProps) => {
  const config = getPlatformConfig(platform);
  const Icon = config.icon;
  return <Icon className={className} style={{ color: config.color }} />;
};

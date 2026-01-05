/**
 * Parse user agent string to extract browser and OS information
 */
export const parseUserAgent = (userAgent?: string): string => {
    if (!userAgent) return 'Unknown Device';

    // Browser detection
    let browser = 'Unknown Browser';
    if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

    // OS detection
    let os = '';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    return os ? `${browser} on ${os}` : browser;
};

/**
 * Mask IP address for privacy (show only first two octets)
 */
export const maskIpAddress = (ip?: string): string => {
    if (!ip) return '';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.x.x`;
    }
    // IPv6 or other format - just show first part
    return ip.split(':')[0] + ':...';
};

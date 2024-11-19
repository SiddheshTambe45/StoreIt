import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'img.freepik.com',
            },
            {
                protocol: 'https',
                hostname: 'cloud.appwrite.io',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb', // Set the limit to your desired size (e.g., 5 MB or more)
        },
    },
};

export default nextConfig;

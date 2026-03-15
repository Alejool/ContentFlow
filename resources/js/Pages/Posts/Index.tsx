import EmptyState from '@/Components/common/EmptyState';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { getEmptyStateByKey } from '@/Utils/emptyStateMapper';
import { Head } from '@inertiajs/react';
import { BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Line } from 'recharts';

const postStats = [
  { time: '08:00', instagram: 200, twitter: 150, facebook: 180 },
  { time: '12:00', instagram: 350, twitter: 220, facebook: 300 },
  { time: '16:00', instagram: 500, twitter: 330, facebook: 420 },
  { time: '20:00', instagram: 620, twitter: 410, facebook: 500 },
  { time: '23:00', instagram: 450, twitter: 380, facebook: 390 },
];

const PLATFORM_COLORS = {
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  facebook: '#1877F2',
};

interface Post {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
  platform: string;
  engagement: number;
  growth: string;
}

const posts: Post[] = [
  {
    id: 1,
    title: 'New Feature Release',
    description: 'Announcing our latest update!',
    image:
      'https://www.elegantthemes.com/blog/wp-content/uploads/2021/02/social-media-books-featured-image.jpg',
    date: '2025-03-09 20:00',
    platform: 'Instagram',
    engagement: 620,
    growth: '+15%',
  },
  {
    id: 2,
    title: 'Tech Tips',
    description: 'Improve your workflow with these tips.',
    image: 'https://dlvrit.com/wp-content/uploads/2022/09/dlvr.it-social-media-posting-2.png',
    date: '2025-03-09 16:00',
    platform: 'Twitter',
    engagement: 330,
    growth: '+10%',
  },
  {
    id: 3,
    title: 'Community Update',
    description: 'We reached 10k followers!',
    image: 'https://media.wiley.com/product_data/coverImage300/19/11190416/1119041619.jpg',
    date: '2025-03-09 12:00',
    platform: 'Facebook',
    engagement: 300,
    growth: '+12%',
  },
];

function ContentCard({ post }: { post: Post }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg bg-white p-4 shadow-md transition duration-300 hover:bg-gray-50">
      <div className="relative h-40 w-full overflow-hidden rounded-md bg-neutral-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex animate-pulse items-center justify-center bg-neutral-100">
            <div className="border-3 h-8 w-8 animate-spin rounded-full border-neutral-300 border-t-neutral-600"></div>
          </div>
        )}

        {!imageError ? (
          <img
            src={post.image}
            alt="Content Thumbnail"
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <svg
              className="h-12 w-12 text-neutral-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{post.description}</p>
        <p className="mt-2 flex items-center gap-1 text-sm text-gray-500">
          <Calendar className="h-4 w-4" /> Published: {post.date} on {post.platform}
        </p>
        <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
          <BarChart3 className="h-4 w-4" /> Engagement: {post.engagement} (
          <TrendingUp className="inline h-3 w-3" />
          {post.growth})
        </p>
      </div>
    </div>
  );
}

export default function SchedulePosts() {
  const { t } = useTranslation();

  return (
    <AuthenticatedLayout>
      <Head title="Schedule Posts" />
      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Scheduled Posts</h1>
            <p className="mt-2 text-lg text-gray-600">
              Track and optimize your content strategy across social platforms.
            </p>
          </div>

          {/* Overview */}
          <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">Post Performance Overview</h3>
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={postStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="instagram"
                    stroke={PLATFORM_COLORS.instagram}
                    name="Instagram"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="twitter"
                    stroke={PLATFORM_COLORS.twitter}
                    name="Twitter"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="facebook"
                    stroke={PLATFORM_COLORS.facebook}
                    name="Facebook"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
            <h3 className="text-xl font-semibold text-gray-800">Recent Posts</h3>
            {posts.length === 0 ? (
              <EmptyState config={getEmptyStateByKey('scheduledPosts', t)!} />
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
                {posts.map((post) => (
                  <ContentCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

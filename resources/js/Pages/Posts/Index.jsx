import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Line } from "@ant-design/plots";
import { PartyPopper, TrendingUp, Calendar, BarChart3 } from "lucide-react";

const postStats = [
  { time: "08:00", instagram: 200, twitter: 150, facebook: 180 },
  { time: "12:00", instagram: 350, twitter: 220, facebook: 300 },
  { time: "16:00", instagram: 500, twitter: 330, facebook: 420 },
  { time: "20:00", instagram: 620, twitter: 410, facebook: 500 },
  { time: "23:00", instagram: 450, twitter: 380, facebook: 390 },
];

const config = {
  data: postStats.flatMap((item) => [
    { time: item.time, platform: "Instagram", engagement: item.instagram },
    { time: item.time, platform: "Twitter", engagement: item.twitter },
    { time: item.time, platform: "Facebook", engagement: item.facebook },
  ]),
  xField: "time",
  yField: "engagement",
  seriesField: "platform",
  smooth: true,
  height: 300,
};

const posts = [
  {
    id: 1,
    title: "New Feature Release",
    description: "Announcing our latest update!",
    image:
      "https://www.elegantthemes.com/blog/wp-content/uploads/2021/02/social-media-books-featured-image.jpg",
    date: "2025-03-09 20:00",
    platform: "Instagram",
    engagement: 620,
    growth: "+15%",
  },
  {
    id: 2,
    title: "Tech Tips",
    description: "Improve your workflow with these tips.",
    image:
      "https://dlvrit.com/wp-content/uploads/2022/09/dlvr.it-social-media-posting-2.png",
    date: "2025-03-09 16:00",
    platform: "Twitter",
    engagement: 330,
    growth: "+10%",
  },
  {
    id: 3,
    title: "Community Update",
    description: "We reached 10k followers!",
    image:
      "https://media.wiley.com/product_data/coverImage300/19/11190416/1119041619.jpg",
    date: "2025-03-09 12:00",
    platform: "Facebook",
    engagement: 300,
    growth: "+12%",
  },
];

function ContentCard({ post }) {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow-md hover:bg-gray-50 transition duration-300 p-4">
      <img
        src={post.image}
        alt="Content Thumbnail"
        className="w-full h-40 object-cover rounded-md"
      />
      <div className="mt-4">
        <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
        <p className="mt-2 text-sm text-gray-600">{post.description}</p>
        <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
          <Calendar className="h-4 w-4" /> Published: {post.date} on{" "}
          {post.platform}
        </p>
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
          <BarChart3 className="h-4 w-4" /> Engagement: {post.engagement} (
          <TrendingUp className="inline h-3 w-3" />
          {post.growth})
        </p>
      </div>
    </div>
  );
}

export default function SchedulePosts() {
  return (
    <AuthenticatedLayout>
      <Head title="Schedule Posts" />
      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Scheduled Posts
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Track and optimize your content strategy across social platforms.
            </p>
          </div>

          {/* Overview */}
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">
              Post Performance Overview
            </h3>
            <div className="mt-4">
              <Line {...config} />
            </div>
          </div>

          {/* Posts Section */}
          <div className="mt-8 bg-white p-6 shadow-md rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">
              Recent Posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              {posts.map((post) => (
                <ContentCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

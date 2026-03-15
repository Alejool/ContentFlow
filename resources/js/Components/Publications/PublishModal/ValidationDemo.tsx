import { useState } from "react";
import { PublishModal } from "./index";

// Demo component to test our validation logic
export default function ValidationDemo() {
  const [showModal, setShowModal] = useState(false);

  // Mock data for testing
  const mockPollPublication = {
    id: 1,
    content_type: "poll",
    title: "Test Poll",
    description: "This is a test poll",
    poll_options: ["Option 1", "Option 2"],
    poll_duration_hours: 24,
    workspace_id: 1,
    mediaFiles: [],
  };

  const mockVideoPublication = {
    id: 2,
    content_type: "reel",
    title: "Test Video",
    description: "This is a test video",
    workspace_id: 1,
    mediaFiles: [{ id: 1, filename: "video.mp4" }],
  };

  const mockSocialAccounts = [
    { id: 1, platform: "twitter", name: "Twitter Account" },
    { id: 2, platform: "youtube", name: "YouTube Channel" },
    { id: 3, platform: "facebook", name: "Facebook Page" },
    { id: 4, platform: "instagram", name: "Instagram Account" },
  ];

  const [currentPublication, setCurrentPublication] = useState(mockPollPublication);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Publish Modal Validation Demo</h1>

      <div className="mb-6 space-y-4">
        <div>
          <h2 className="mb-2 text-lg font-semibold">Test Publications:</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentPublication(mockPollPublication)}
              className={`rounded px-4 py-2 ${
                currentPublication.content_type === "poll"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Poll Publication
            </button>
            <button
              onClick={() => setCurrentPublication(mockVideoPublication)}
              className={`rounded px-4 py-2 ${
                currentPublication.content_type === "reel"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Video Publication
            </button>
          </div>
        </div>

        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-medium">Current Publication:</h3>
          <p>
            <strong>Type:</strong> {currentPublication.content_type}
          </p>
          <p>
            <strong>Title:</strong> {currentPublication.title}
          </p>
          {currentPublication.content_type === "poll" && (
            <p>
              <strong>Poll Options:</strong> {(currentPublication as any).poll_options?.join(", ")}
            </p>
          )}
        </div>

        <div className="rounded bg-gray-100 p-4">
          <h3 className="mb-2 font-medium">Available Platforms:</h3>
          <ul className="list-inside list-disc">
            {mockSocialAccounts.map((account) => (
              <li key={account.id}>
                <strong>{account.platform}:</strong> {account.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded bg-yellow-100 p-4">
          <h3 className="mb-2 font-medium">Expected Validation Results:</h3>
          {currentPublication.content_type === "poll" ? (
            <ul className="list-inside list-disc text-sm">
              <li>✅ Twitter: Should allow polls</li>
              <li>❌ Facebook: No soporta encuestas nativas</li>
              <li>❌ YouTube: Should reject polls (not supported)</li>
              <li>❌ Instagram: Should reject polls (not supported)</li>
            </ul>
          ) : (
            <ul className="list-inside list-disc text-sm">
              <li>✅ Instagram: Should allow reels</li>
              <li>✅ YouTube: Should allow reels</li>
              <li>❌ Twitter: Should reject reels (not supported)</li>
              <li>✅ Facebook: Should allow reels (now supported)</li>
            </ul>
          )}
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Open Publish Modal
      </button>

      <PublishModal
        show={showModal}
        publication={currentPublication as any}
        socialAccounts={mockSocialAccounts as any}
        onClose={() => setShowModal(false)}
        onPublished={(data) => {
          console.log("Published:", data);
          setShowModal(false);
        }}
      />
    </div>
  );
}

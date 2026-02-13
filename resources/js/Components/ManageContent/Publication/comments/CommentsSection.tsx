import { Avatar } from "@/Components/common/Avatar";
import axios from "axios";
import { format } from "date-fns";
import { Send, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    photo_url?: string;
  };
}

interface CommentsSectionProps {
  publicationId: number;
  currentUser: any;
}

export const CommentsSection = ({
  publicationId,
  currentUser,
}: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        route("api.v1.publications.comments.index", publicationId),
      );
      setComments(response.data);
    } catch (error) {
      console.error("Failed to fetch comments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (publicationId) {
      fetchComments();
    }
  }, [publicationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await axios.post(
        route("api.v1.publications.comments.store", publicationId),
        {
          content: newComment,
        },
      );
      setComments((prev) => [...prev, response.data]);
      setNewComment("");
    } catch (error) {
      toast.error(
        t("publications.modal.comments.postError") || "Failed to post comment",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (
      !confirm(
        t("publications.modal.comments.deleteConfirm") || "Are you sure?",
      )
    )
      return;
    try {
      await axios.delete(
        route("api.v1.publications.comments.destroy", {
          publication: publicationId,
          comment: commentId,
        }),
      );
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success(
        t("publications.modal.comments.deleteSuccess") || "Comment deleted",
      );
    } catch (error) {
      toast.error(
        t("publications.modal.comments.deleteError") ||
          "Failed to delete comment",
      );
    }
  };

  if (!publicationId) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t("publications.modal.comments.title") || "Internal Comments"}
      </h3>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {loading && comments.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            {t("publications.modal.comments.loading") || "Loading comments..."}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            {t("publications.modal.comments.noComments") ||
              "No comments yet. Start the conversation!"}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar
                src={comment.user.photo_url}
                name={comment.user.name}
                size="sm"
              />
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {comment.user.name}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {format(new Date(comment.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {currentUser.id === comment.user.id && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Trash className="w-3 h-3" />{" "}
                    {t("publications.modal.comments.delete") || "Delete"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          placeholder={
            t("publications.modal.comments.placeholder") || "Write a comment..."
          }
          className="w-full pl-4 pr-10 py-2 text-sm bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          disabled={submitting}
        />
        <button
          type="button"
          onClick={handleSubmit as any}
          disabled={!newComment.trim() || submitting}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

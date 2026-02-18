import { Avatar } from "@/Components/common/Avatar";
import axios from "axios";
import { format } from "date-fns";
import { Send, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import Button from "@/Components/common/Modern/Button";

interface Comment {
  id: number;
  content: string;
  created_at: string;
  parent_id?: number | null;
  user: {
    id: number;
    name: string;
    photo_url?: string;
  };
  replies?: Comment[];
}

interface WorkspaceMember {
  id: number;
  name: string;
  email: string;
  photo_url?: string;
}

interface CommentsSectionProps {
  publicationId: number;
  currentUser: any;
}

export const CommentsSection = ({
  publicationId,
  currentUser,
}: CommentsSectionProps) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      if (!currentUser?.current_workspace_id) return;
      const response = await axios.get(
        route("api.v1.workspaces.members", currentUser.current_workspace_id),
      );
      setMembers(response.data.members || []);
    } catch (error) {
      console.error("Failed to fetch members", error);
    }
  };

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
      fetchMembers();
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
          parent_id: replyTo?.id || null,
        },
      );

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id
              ? { ...c, replies: [...(c.replies || []), response.data] }
              : c,
          ),
        );
      } else {
        setComments((prev) => [response.data, ...prev]);
      }

      setNewComment("");
      setReplyTo(null);
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await axios.delete(
        route("api.v1.publications.comments.destroy", {
          publication: publicationId,
          comment: commentId,
        }),
      );
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  if (!publicationId) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Internal Comments
      </h3>

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {loading && comments.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-4">
            No comments yet. Start the conversation!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <div className="flex gap-3 group">
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
                  <div className="flex items-center gap-4 mt-1.5">
                    <Button
                      type="button"
                      onClick={() => {
                        setReplyTo(comment);
                        setNewComment(`@${comment.user.name} `);
                      }}
                      buttonStyle="ghost"
                      variant="ghost"
                      size="xs"
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-0 h-auto min-h-0"
                    >
                      {t("common.reply") || "Reply"}
                    </Button>
                    {currentUser.id === comment.user.id && (
                      <Button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        buttonStyle="ghost"
                        variant="ghost"
                        size="xs"
                        className="text-xs font-semibold text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-0 h-auto min-h-0"
                      >
                        {t("publications.modal.comments.delete") || "Delete"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-5 mt-2 pl-6 border-l border-gray-200 dark:border-neutral-700 space-y-4 relative">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="relative">
                      <div className="flex gap-2 group">
                        <Avatar
                          src={reply.user.photo_url}
                          name={reply.user.name}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 dark:bg-neutral-900 rounded-lg px-4 py-2">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                                {reply.user.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {format(
                                  new Date(reply.created_at),
                                  "MMM d, h:mm a",
                                )}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                          {currentUser.id === reply.user.id && (
                            <Button
                              type="button"
                              onClick={() => handleDelete(reply.id)}
                              buttonStyle="ghost"
                              variant="danger"
                              size="xs"
                              icon={Trash}
                              className="mt-1 opacity-0 group-hover:opacity-100"
                            >
                              {t("publications.modal.comments.delete") ||
                                "Delete"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="relative">
        {replyTo && (
          <div className="flex items-center justify-between px-3 py-1 bg-primary-50 dark:bg-primary-900/10 rounded-t-lg border-x border-t border-gray-200 dark:border-neutral-800 text-[10px] text-primary-700 dark:text-primary-400">
            <span>
              {t("publications.modal.comments.replyingTo") || "Replying to"}{" "}
              <span className="font-semibold">{replyTo.user.name}</span>
            </span>
            <Button
              onClick={() => {
                setReplyTo(null);
                if (newComment.startsWith(`@${replyTo.user.name}`)) {
                  setNewComment(
                    newComment.replace(`@${replyTo.user.name} `, ""),
                  );
                }
              }}
              buttonStyle="ghost"
              variant="ghost"
              size="xs"
              className="hover:text-primary-900"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
          </div>
        )}

        {showMentions && (
          <div className="absolute bottom-full left-0 w-full mb-1 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto custom-scrollbar">
            {members
              .filter(
                (m) =>
                  m.name.toLowerCase().includes(mentionFilter.toLowerCase()) &&
                  m.id !== currentUser.id,
              )
              .map((member) => (
                <Button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    const parts = newComment.split("@");
                    parts.pop();
                    setNewComment(parts.join("@") + `@${member.name} `);
                    setShowMentions(false);
                  }}
                  buttonStyle="ghost"
                  variant="ghost"
                  fullWidth
                  className="flex items-center gap-2 px-3 py-2 text-left"
                >
                  <Avatar src={member.photo_url} name={member.name} size="xs" />
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {member.name}
                  </span>
                </Button>
              ))}
          </div>
        )}

        <input
          type="text"
          value={newComment}
          onChange={(e) => {
            const val = e.target.value;
            setNewComment(val);

            const lastAt = val.lastIndexOf("@");
            if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === " ")) {
              setShowMentions(true);
              setMentionFilter(val.substring(lastAt + 1));
            } else {
              setShowMentions(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          placeholder={
            t("publications.modal.comments.placeholder") || "Write a comment..."
          }
          className={`w-full pl-4 pr-10 py-2 text-sm bg-white dark:bg-black border border-gray-200 dark:border-neutral-800 rounded-lg focus:ring-primary-500 focus:border-primary-500 ${replyTo ? "rounded-t-none" : ""}`}
          disabled={submitting}
        />
        <Button
          type="submit"
          disabled={!newComment.trim() || submitting}
          buttonStyle="icon"
          variant="primary"
          icon={Send}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        />
      </div>
    </div>
  );
};

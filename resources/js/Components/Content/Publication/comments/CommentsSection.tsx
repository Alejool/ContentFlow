import { Avatar } from '@/Components/common/Avatar';
import Button from '@/Components/common/Modern/Button';
import Input from '@/Components/common/Modern/Input';
import ConfirmDialog from '@/Components/common/ui/ConfirmDialog';
import axios from 'axios';
import { format } from 'date-fns';
import { Send, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

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

export const CommentsSection = ({ publicationId, currentUser }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const { t } = useTranslation();

  const fetchMembers = async () => {
    try {
      if (!currentUser?.current_workspace_id) return;
      const response = await axios.get(
        route('api.v1.workspaces.members', currentUser.current_workspace_id),
      );
      setMembers(response.data.members || []);
    } catch (error) {}
  };

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('api.v1.publications.comments.index', publicationId));
      setComments(response.data);
    } catch (error) {
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
        route('api.v1.publications.comments.store', publicationId),
        {
          content: newComment,
          parent_id: replyTo?.id || null,
        },
      );

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies || []), response.data] } : c,
          ),
        );
      } else {
        setComments((prev) => [response.data, ...prev]);
      }

      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      toast.error(t('publications.modal.comments.postError') || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    setCommentToDelete(commentId);
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;

    try {
      await axios.delete(
        route('api.v1.publications.comments.destroy', {
          publication: publicationId,
          comment: commentToDelete,
        }),
      );
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete));
      toast.success(t('publications.modal.comments.deleteSuccess') || 'Comment deleted');
    } catch (error) {
      toast.error(t('publications.modal.comments.deleteError') || 'Failed to delete comment');
    } finally {
      setCommentToDelete(null);
    }
  };

  if (!publicationId) return null;

  return (
    <div className="space-y-4">
      <div className="custom-scrollbar max-h-[300px] space-y-4 overflow-y-auto pr-2">
        {loading && comments.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">
            {t('publications.modal.comments.loading') || 'Loading comments...'}
          </div>
        ) : comments.length === 0 ? (
          <div className="py-4 text-center text-sm text-gray-500">
            {t('publications.modal.comments.noComments') ||
              'No comments yet. Start the conversation!'}
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <div className="group flex gap-3">
                <Avatar src={comment.user.photo_url} name={comment.user.name} size="sm" />
                <div className="flex-1">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {comment.user.name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(comment);
                        setNewComment(`@${comment.user.name} `);
                      }}
                      className="text-[11px] font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      {t('common.reply') || 'Reply'}
                    </button>
                    {currentUser.id === comment.user.id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="flex items-center gap-1 text-xs text-red-500 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                      >
                        <Trash className="h-3 w-3" />{' '}
                        {t('publications.modal.comments.delete') || 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="relative ml-5 mt-2 space-y-4 border-l border-gray-200 pl-6 dark:border-neutral-700">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="relative">
                      <div className="group flex gap-2">
                        <Avatar src={reply.user.photo_url} name={reply.user.name} size="sm" />
                        <div className="flex-1">
                          <div className="rounded-lg bg-gray-100 px-4 py-2 dark:bg-neutral-900">
                            <div className="mb-0.5 flex items-center justify-between">
                              <span className="text-[12px] font-bold text-gray-900 dark:text-gray-100">
                                {reply.user.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                              {reply.content}
                            </p>
                          </div>
                          {currentUser.id === reply.user.id && (
                            <button
                              type="button"
                              onClick={() => handleDelete(reply.id)}
                              className="mt-1 flex items-center gap-1 text-[10px] text-red-500 opacity-0 transition-opacity hover:text-red-700 group-hover:opacity-100"
                            >
                              <Trash className="h-2.5 w-2.5" />{' '}
                              {t('publications.modal.comments.delete') || 'Delete'}
                            </button>
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
          <div className="flex items-center justify-between rounded-t-lg border-x border-t border-gray-200 bg-primary-50 px-3 py-1 text-[10px] text-primary-700 dark:border-neutral-800 dark:bg-primary-900/10 dark:text-primary-400">
            <span>
              {t('publications.modal.comments.replyingTo') || 'Respondiendo a'}{' '}
              <span className="font-semibold">{replyTo.user.name}</span>
            </span>
            <button
              onClick={() => {
                setReplyTo(null);
                if (newComment.startsWith(`@${replyTo.user.name}`)) {
                  setNewComment(newComment.replace(`@${replyTo.user.name} `, ''));
                }
              }}
              className="hover:text-primary-900"
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
          </div>
        )}

        {showMentions && (
          <div className="custom-scrollbar absolute bottom-full left-0 z-50 mb-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
            {members
              .filter(
                (m) =>
                  m.name.toLowerCase().includes(mentionFilter.toLowerCase()) &&
                  m.id !== currentUser.id,
              )
              .map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    const parts = newComment.split('@');
                    parts.pop();
                    setNewComment(parts.join('@') + `@${member.name} `);
                    setShowMentions(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800"
                >
                  <Avatar src={member.photo_url} name={member.name} size="xs" />
                  <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                    {member.name}
                  </span>
                </button>
              ))}
          </div>
        )}

        <div className="relative">
          <Input
            id="comment-input"
            type="text"
            value={newComment}
            onChange={(e) => {
              const val = e.target.value;
              setNewComment(val);

              const lastAt = val.lastIndexOf('@');
              if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === ' ')) {
                setShowMentions(true);
                setMentionFilter(val.substring(lastAt + 1));
              } else {
                setShowMentions(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
            placeholder={t('publications.modal.comments.placeholder') || 'Write a comment...'}
            className={`pr-12 ${replyTo ? 'rounded-t-none' : ''}`}
            disabled={submitting}
            variant="outlined"
            sizeType="md"
          />
          <Button
            type="button"
            onClick={handleSubmit as any}
            disabled={!newComment.trim() || submitting}
            variant="primary"
            buttonStyle="icon"
            size="sm"
            icon={Send}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={confirmDelete}
        title={t('publications.modal.comments.deleteConfirmTitle') || '¿Eliminar comentario?'}
        message={
          t('publications.modal.comments.deleteConfirmMessage') ||
          '¿Estás seguro de que quieres eliminar este comentario?'
        }
        confirmText={t('common.delete') || 'Eliminar'}
        cancelText={t('common.cancel') || 'Cancelar'}
        type="danger"
      />
    </div>
  );
};

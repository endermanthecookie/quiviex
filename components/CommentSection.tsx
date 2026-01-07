
import React, { useState, useEffect } from 'react';
import { User, Comment } from '../types';
import { supabase } from '../services/supabase';
import { MessageCircle, Send, User as UserIcon, Trash2 } from 'lucide-react';

interface CommentSectionProps {
  quizId: number;
  currentUser: User;
  isSudo: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ quizId, currentUser, isSudo }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [quizId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform flat structure to tree
      const rawComments: Comment[] = (data || []).map((c: any) => ({
        id: c.id,
        quizId: c.quiz_id,
        userId: c.user_id,
        username: c.username,
        content: c.content,
        createdAt: c.created_at,
        parentId: c.parent_id
      }));

      const tree = buildCommentTree(rawComments);
      setComments(tree);
    } catch (e) {
      // Fix: Access console via window to resolve "Cannot find name 'console'" error
      (window as any).console.error("Error fetching comments:", e);
    }
  };

  const buildCommentTree = (flatComments: Comment[]): Comment[] => {
    const map: Record<string, Comment> = {};
    const roots: Comment[] = [];

    // Initialize map with empty replies arrays
    flatComments.forEach(c => {
      map[c.id] = { ...c, replies: [] };
    });

    flatComments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies?.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    // Sort roots by newest first (optional, currently ascending from fetch, reversing to show newest on top if desired, or keep chronological)
    return roots.reverse();
  };

  const handleSubmit = async (parentId: string | null = null) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('comments').insert({
        quiz_id: quizId,
        user_id: currentUser.id,
        username: currentUser.username,
        content: content.trim(),
        parent_id: parentId
      });

      if (error) throw error;

      setNewComment('');
      setReplyContent('');
      setReplyTo(null);
      await fetchComments();
    } catch (e) {
      // Fix: Access console and alert via window
      (window as any).console.error("Failed to post comment:", e);
      (window as any).alert("Could not post comment.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    // Fix: Access confirm via window to resolve "Cannot find name 'confirm'" error
    if (!(window as any).confirm("Delete this comment?")) return;
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      fetchComments();
    } catch (e) {
      // Fix: Access console via window
      (window as any).console.error("Delete failed:", e);
    }
  };

  const CommentItem: React.FC<{ comment: Comment; depth?: number }> = ({ comment, depth = 0 }) => {
    const isOwner = comment.userId === currentUser.id;
    const canDelete = isOwner || isSudo;
    const isReplying = replyTo === comment.id;

    return (
      <div className={`flex gap-3 mb-4 ${depth > 0 ? 'ml-8 sm:ml-12 mt-2' : ''}`}>
        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
          <UserIcon size={depth === 0 ? 20 : 16} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl rounded-tl-none border border-slate-200">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-slate-800 text-sm">{comment.username}</span>
              <span className="text-xs text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{comment.content}</p>
          </div>

          <div className="flex items-center gap-4 mt-1 pl-2">
            {depth < 3 && (
              <button 
                onClick={() => setReplyTo(isReplying ? null : comment.id)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button 
                onClick={() => handleDelete(comment.id)}
                className="text-xs font-bold text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-3 flex gap-2">
              <input 
                type="text" 
                value={replyContent}
                // Fix: Cast e.target to any to access value property
                onChange={(e) => setReplyContent((e.target as any).value)}
                placeholder={`Reply to ${comment.username}...`}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button 
                onClick={() => handleSubmit(comment.id)}
                disabled={isLoading || !replyContent.trim()}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-800">Comments ({comments.length})</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 shadow-sm">
        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
          <UserIcon size={20} />
        </div>
        <div className="flex-1 flex gap-2">
          <textarea 
            value={newComment}
            // Fix: Cast e.target to any to access value property
            onChange={(e) => setNewComment((e.target as any).value)}
            placeholder="Write a comment..."
            className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all resize-none h-12 min-h-[48px]"
          />
          <button 
            onClick={() => handleSubmit(null)}
            disabled={isLoading || !newComment.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 self-end"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
        {comments.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p>No comments yet. Be the first to say something!</p>
          </div>
        )}
      </div>
    </div>
  );
};

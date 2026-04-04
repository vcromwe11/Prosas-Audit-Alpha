import React, { useState, useEffect } from 'react';
import { ReportComment, UserProfile } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface Props {
  reportId: string;
  userRole?: string;
  currentUser: UserProfile | null;
}

const CommentsSection: React.FC<Props> = ({ reportId, userRole, currentUser }) => {
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    
    const commentsRef = collection(db, 'reports', reportId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReportComment[];
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching comments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [reportId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    try {
      const commentsRef = collection(db, 'reports', reportId, 'comments');
      await addDoc(commentsRef, {
        reportId,
        userId: currentUser.uid,
        userName: currentUser.name,
        userAvatar: currentUser.avatarUrl,
        text: newComment.trim(),
        status: 'PENDING',
        createdAt: Date.now()
      });
      setNewComment('');
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleUpdateStatus = async (commentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const commentRef = doc(db, 'reports', reportId, 'comments', commentId);
      await updateDoc(commentRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating comment status:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const commentRef = doc(db, 'reports', reportId, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const canComment = userRole && ['COMENTADOR', 'EDITOR', 'ADMIN', 'DEV'].includes(userRole);
  const canManageComments = userRole && ['EDITOR', 'ADMIN', 'DEV'].includes(userRole);

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Comentários e Propostas de Alteração</h3>
        <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500">
          {comments.length}
        </span>
      </div>
      
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500 py-4">Carregando comentários...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-4 italic">Nenhum comentário ainda.</div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <span className="font-bold text-gray-800 text-sm">{comment.userName}</span>
                      <span className="text-xs text-gray-400 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.status === 'PENDING' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">PENDENTE</span>}
                      {comment.status === 'APPROVED' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700">APROVADO</span>}
                      {comment.status === 'REJECTED' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">REJEITADO</span>}
                      
                      {(canManageComments || currentUser?.uid === comment.userId) && (
                        <button onClick={() => handleDeleteComment(comment.id!)} className="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                  
                  {canManageComments && comment.status === 'PENDING' && (
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(comment.id!, 'APPROVED')}
                        className="text-xs font-bold px-3 py-1 bg-green-50 text-green-600 border border-green-200 rounded hover:bg-green-100 transition-colors"
                      >
                        Aprovar
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(comment.id!, 'REJECTED')}
                        className="text-xs font-bold px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canComment && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-2">Adicionar Comentário</h4>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Proponha uma alteração ou deixe um comentário..."
              className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:ring-prosas-blue focus:border-prosas-blue outline-none transition-colors min-h-[100px]"
            ></textarea>
            <div className="mt-2 flex justify-end">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-prosas-blue text-white rounded text-sm font-bold hover:bg-prosas-blueDark disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all transform active:scale-95"
              >
                Enviar Comentário
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;

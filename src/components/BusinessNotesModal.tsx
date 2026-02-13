import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BusinessApiService } from '../services/businessApi';
import type { BusinessNote } from '../types/business';

interface BusinessNotesModalProps {
  businessResultId: string;
  businessName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessNotesModal({ 
  businessResultId, 
  businessName, 
  isOpen, 
  onClose 
}: BusinessNotesModalProps) {
  const [notes, setNotes] = useState<BusinessNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, businessResultId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await BusinessApiService.getBusinessNotes(businessResultId);
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.trim()) return;

    try {
      await BusinessApiService.createBusinessNote(businessResultId, newNote.trim());
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      await BusinessApiService.updateBusinessNote(noteId, editContent.trim());
      setEditingNote(null);
      setEditContent('');
      await loadNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;

    try {
      await BusinessApiService.deleteBusinessNote(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const startEditing = (note: BusinessNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            ملاحظات: {businessName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {/* New Note Input */}
          <div className="mb-6">
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="أضف ملاحظة جديدة..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <button
                onClick={handleCreateNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة
              </button>
            </div>
          </div>

          {/* Notes List */}
          {loading ? (
            <div className="text-center text-gray-600 py-8">جاري التحميل...</div>
          ) : notes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              لا توجد ملاحظات حتى الآن
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                  {editingNote === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateNote(note.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          حفظ
                        </button>
                        <button
                          onClick={() => {
                            setEditingNote(null);
                            setEditContent('');
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-900 whitespace-pre-wrap mb-2">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {format(new Date(note.created_at), 'PPp', { locale: ar })}
                          {note.updated_at !== note.created_at && (
                            <span className="mr-2">(محدثة)</span>
                          )}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

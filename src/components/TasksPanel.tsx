import React, { useState, useEffect } from 'react';
import { Plus, Check, X, Calendar, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BusinessApiService } from '../services/businessApi';
import type { Task } from '../types/business';

type TaskFilter = 'all' | 'pending' | 'completed' | 'overdue';

export default function TasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    business_result_id: ''
  });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const filters = filter === 'pending' ? { completed: false } : 
                       filter === 'completed' ? { completed: true } : 
                       undefined;
      const data = await BusinessApiService.getTasks(filters);
      
      let filteredTasks = data;
      if (filter === 'overdue') {
        filteredTasks = data.filter(task => 
          !task.completed && 
          task.due_date && 
          isPast(new Date(task.due_date)) &&
          !isToday(new Date(task.due_date))
        );
      }
      
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await BusinessApiService.createTask({
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        due_date: newTask.due_date || undefined,
        business_result_id: newTask.business_result_id || undefined
      });
      
      setNewTask({ title: '', description: '', due_date: '', business_result_id: '' });
      setShowAddForm(false);
      await loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleStatus = async (taskId: string, currentCompleted: boolean) => {
    try {
      await BusinessApiService.updateTaskStatus(taskId, !currentCompleted);
      await loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTaskDateInfo = (dueDate: string | null) => {
    if (!dueDate) return { text: '', color: 'text-gray-400', urgent: false };
    
    const date = new Date(dueDate);
    
    if (isPast(date) && !isToday(date)) {
      return { 
        text: `متأخر - ${format(date, 'PPP', { locale: ar })}`,
        color: 'text-red-600',
        urgent: true
      };
    }
    
    if (isToday(date)) {
      return { 
        text: 'اليوم',
        color: 'text-orange-600',
        urgent: true
      };
    }
    
    if (isTomorrow(date)) {
      return { 
        text: 'غداً',
        color: 'text-yellow-600',
        urgent: false
      };
    }
    
    return { 
      text: format(date, 'PPP', { locale: ar }),
      color: 'text-gray-600',
      urgent: false
    };
  };

  const filterCounts = {
    all: tasks.length,
    pending: tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    overdue: tasks.filter(t => 
      !t.completed && 
      t.due_date && 
      isPast(new Date(t.due_date)) &&
      !isToday(new Date(t.due_date))
    ).length
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">المهام</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          مهمة جديدة
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          الكل ({filterCounts.all})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'pending'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          قيد الانتظار ({filterCounts.pending})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'overdue'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          متأخرة ({filterCounts.overdue})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'completed'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          مكتملة ({filterCounts.completed})
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-blue-200">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان المهمة *
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="أدخل عنوان المهمة"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الوصف
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="أدخل وصف المهمة (اختياري)"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الاستحقاق
              </label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                إنشاء المهمة
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewTask({ title: '', description: '', due_date: '', business_result_id: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="text-center text-gray-600 py-8">جاري التحميل...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>لا توجد مهام</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const dateInfo = getTaskDateInfo(task.due_date);
            
            return (
              <div
                key={task.id}
                className={`bg-white rounded-lg shadow-sm p-4 border ${
                  task.completed 
                    ? 'border-green-200 bg-green-50' 
                    : dateInfo.urgent 
                    ? 'border-red-200' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(task.id, task.completed)}
                    className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300 hover:border-blue-500'
                    }`}
                  >
                    {task.completed && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      task.completed 
                        ? 'text-gray-500 line-through' 
                        : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-sm ${dateInfo.color}`}>
                          <Calendar className="w-4 h-4" />
                          {dateInfo.text}
                        </div>
                      )}
                      
                      <span className="text-xs text-gray-500">
                        أنشئت {format(new Date(task.created_at), 'PPP', { locale: ar })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

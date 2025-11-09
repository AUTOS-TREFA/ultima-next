'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Sparkles } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/AuthContext';
import GeminiService from '../services/GeminiService';

interface RoadmapItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  progress: number;
  eta: string;
  is_published: boolean;
}

const AdminRoadmapManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [showForm, setShowForm] = useState(false);

  const emptyItem: RoadmapItem = {
    title: '',
    description: '',
    category: 'Nueva Funcionalidad',
    status: 'Planificado para Iniciar',
    priority: 'Media',
    progress: 0,
    eta: '',
    is_published: false
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadItems();
    }
  }, [profile]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading roadmap items:', error);
      alert('Error al cargar items del roadmap');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: RoadmapItem) => {
    try {
      if (item.id) {
        // Update existing
        const { error } = await supabase
          .from('roadmap_items')
          .update({
            ...item,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('roadmap_items')
          .insert({
            ...item,
            created_by: user?.id
          });

        if (error) throw error;
      }

      await loadItems();
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving roadmap item:', error);
      alert(`Error al guardar: ${(error as Error).message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadItems();
    } catch (error) {
      console.error('Error deleting roadmap item:', error);
      alert('Error al eliminar item');
    }
  };

  const handleEdit = (item: RoadmapItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditingItem(emptyItem);
    setShowForm(true);
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Administrar Roadmap</h3>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Item
        </button>
      </div>

      {showForm && editingItem && (
        <RoadmapItemForm
          item={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}

      <div className="space-y-3 mt-4">
        {items.map(item => (
          <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.is_published ? 'Publicado' : 'Borrador'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                    {item.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Progreso: {item.progress}%</span>
                  <span>Prioridad: {item.priority}</span>
                  {item.eta && <span>ETA: {item.eta}</span>}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay items en el roadmap. Haz clic en "Nuevo Item" para agregar uno.
        </div>
      )}
    </div>
  );
};

const RoadmapItemForm: React.FC<{
  item: RoadmapItem;
  onSave: (item: RoadmapItem) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState<RoadmapItem>(item);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleEnhanceWithAI = async () => {
    if (!formData.description.trim()) {
      alert('Por favor ingresa una descripción básica primero');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhanced = await GeminiService.enhanceRoadmapFeature(formData.description);

      // Parse the enhanced response
      const titleMatch = enhanced.match(/TÍTULO:\s*(.+?)(?:\n|$)/);
      const descMatch = enhanced.match(/DESCRIPCIÓN:\s*([\s\S]+?)(?=CASOS DE USO:|$)/);

      if (titleMatch && titleMatch[1].trim()) {
        setFormData(prev => ({ ...prev, title: titleMatch[1].trim() }));
      }

      if (descMatch && descMatch[1].trim()) {
        // Keep the full enhanced response as description
        setFormData(prev => ({ ...prev, description: enhanced }));
      }

      alert('✨ Descripción mejorada con IA!');
    } catch (error) {
      console.error('Error enhancing with AI:', error);
      alert('Error al mejorar con IA. Verifica que VITE_GEMINI_API_KEY esté configurado.');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-6 mb-4">
      <h4 className="font-semibold text-gray-900 mb-4">
        {item.id ? 'Editar Item' : 'Nuevo Item del Roadmap'}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Descripción *
            </label>
            <button
              type="button"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing || !formData.description.trim()}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {isEnhancing ? 'Mejorando con IA...' : 'Mejorar con IA'}
            </button>
          </div>
          <textarea
            required
            rows={8}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Escribe una descripción básica y luego haz clic en 'Mejorar con IA' para que Gemini la expanda automáticamente..."
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Tip: Escribe una idea básica (ej: "Sistema de chat en vivo") y la IA la expandirá con casos de uso, impacto esperado y consideraciones técnicas
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option>Nueva Funcionalidad</option>
            <option>Integración</option>
            <option>Marketing</option>
            <option>IA & Automatización</option>
            <option>Crecimiento</option>
            <option>Plataforma</option>
            <option>SEO & Analytics</option>
            <option>Marketing Digital</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option>Planificado para Iniciar</option>
            <option>En Desarrollo Activo</option>
            <option>En Planeación</option>
            <option>Completado</option>
            <option>En Pausa</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option>Baja</option>
            <option>Media</option>
            <option>Alta</option>
            <option>Crítica</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Progreso (0-100%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.progress}
            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ETA (Fecha estimada)
          </label>
          <input
            type="text"
            placeholder="ej: Noviembre 2025"
            value={formData.eta}
            onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Publicar (visible para todos)</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default AdminRoadmapManager;

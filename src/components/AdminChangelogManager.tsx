import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../context/AuthContext';

interface ChangelogItem {
  id?: string;
  version: string;
  title: string;
  date: string;
  category: string;
  features: string[]; // Array of feature descriptions
  development_hours: number;
  files_modified: string;
  is_published: boolean;
}

const AdminChangelogManager: React.FC = () => {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ChangelogItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  const emptyItem: ChangelogItem = {
    version: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    category: 'feature',
    features: [],
    development_hours: 0,
    files_modified: '',
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
        .from('changelog_items')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading changelog items:', error);
      alert('Error al cargar items del changelog');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: ChangelogItem) => {
    try {
      if (item.id) {
        // Update existing
        const { error } = await supabase
          .from('changelog_items')
          .update({
            ...item,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('changelog_items')
          .insert({
            ...item,
            created_by: user?.id
          });

        if (error) throw error;
      }

      await loadItems();
      setShowForm(false);
      setEditingItem(null);
      setFeatureInput('');
    } catch (error: any) {
      console.error('Error saving changelog item:', error);
      alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      const { error } = await supabase
        .from('changelog_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadItems();
    } catch (error: any) {
      console.error('Error deleting changelog item:', error);
      alert('Error al eliminar item');
    }
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;

    if (editingItem) {
      setEditingItem({
        ...editingItem,
        features: [...editingItem.features, featureInput.trim()]
      });
    }
    setFeatureInput('');
  };

  const removeFeature = (index: number) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        features: editingItem.features.filter((_, i) => i !== index)
      });
    }
  };

  if (profile?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
        <p className="text-orange-700">Cargando changelog...</p>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-orange-900">🛠️ Admin: Gestionar Changelog</h3>
        <button
          onClick={() => {
            setEditingItem(emptyItem);
            setShowForm(true);
            setFeatureInput('');
          }}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Item
        </button>
      </div>

      {showForm && editingItem && (
        <div className="bg-white p-6 rounded-lg border-2 border-orange-300 mb-4 space-y-4">
          <h4 className="font-bold text-orange-900">
            {editingItem.id ? 'Editar Item' : 'Nuevo Item de Changelog'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Versión</label>
              <input
                type="text"
                value={editingItem.version}
                onChange={(e) => setEditingItem({ ...editingItem, version: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="v1.2.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={editingItem.date}
                onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={editingItem.title}
              onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Mejoras del Formulario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={editingItem.category}
              onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="feature">✨ Feature</option>
              <option value="improvement">📈 Improvement</option>
              <option value="bugfix">🐛 Bug Fix</option>
              <option value="integration">🔗 Integration</option>
              <option value="design">🎨 Design</option>
              <option value="performance">⚡ Performance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Features / Cambios</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder="Descripción del cambio..."
              />
              <button
                type="button"
                onClick={addFeature}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2">
              {editingItem.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <span className="flex-1 text-sm">{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas de Desarrollo</label>
              <input
                type="number"
                value={editingItem.development_hours}
                onChange={(e) => setEditingItem({ ...editingItem, development_hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min="0"
                step="0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivos Modificados</label>
              <input
                type="text"
                value={editingItem.files_modified}
                onChange={(e) => setEditingItem({ ...editingItem, files_modified: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="3 archivos"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editingItem.is_published}
              onChange={(e) => setEditingItem({ ...editingItem, is_published: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm font-medium text-gray-700">Publicar (visible para usuarios)</label>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={() => handleSave(editingItem)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingItem(null);
                setFeatureInput('');
              }}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
            <div>
              <p className="font-semibold text-orange-900">
                {item.version} - {item.title}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(item.date).toLocaleDateString('es-MX')} • {item.features.length} cambios
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {item.is_published ? '✅ Publicado' : '⏸️ Borrador'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingItem(item);
                  setShowForm(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => item.id && handleDelete(item.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No hay items en el changelog. Crea uno nuevo para empezar.
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminChangelogManager;

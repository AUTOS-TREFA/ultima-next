import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface ChangelogItem {
  id: string;
  version: string;
  title: string;
  date: string;
  category: string;
  features: string[];
  development_hours: number;
  files_modified: string;
  is_published: boolean;
}

const categoryConfig: Record<string, { label: string; color: string; emoji: string }> = {
  feature: { label: 'Feature', color: 'green', emoji: '✨' },
  improvement: { label: 'Improvement', color: 'blue', emoji: '📈' },
  bugfix: { label: 'Bug Fix', color: 'red', emoji: '🐛' },
  integration: { label: 'Integration', color: 'purple', emoji: '🔗' },
  design: { label: 'Design', color: 'orange', emoji: '🎨' },
  performance: { label: 'Performance', color: 'yellow', emoji: '⚡' }
};

const DynamicChangelogDisplay: React.FC = () => {
  const [items, setItems] = useState<ChangelogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedItems();
  }, []);

  const loadPublishedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('changelog_items')
        .select('*')
        .eq('is_published', true)
        .order('date', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cargando changelog...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return null; // Don't show anything if no dynamic items
  }

  return (
    <div className="space-y-12">
      {items.map((item) => {
        const config = categoryConfig[item.category] || categoryConfig.feature;
        const borderColor = `border-${config.color}-500`;

        return (
          <div key={item.id} className={`border-l-4 ${borderColor} pl-8`}>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">{item.version}</h2>
              <span className={`bg-${config.color}-100 text-${config.color}-700 px-4 py-1 rounded-full text-sm font-bold`}>
                {config.emoji} {item.title}
              </span>
              <span className="bg-gray-100 px-4 py-1 rounded-full text-sm text-gray-600">
                {new Date(item.date).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`bg-${config.color}-100 text-${config.color}-800 px-3 py-1 rounded-lg text-xs font-bold uppercase`}>
                    {config.emoji} {config.label}
                  </span>
                </div>

                <ul className="space-y-2 text-gray-700">
                  {item.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">✅</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Development Time */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Tiempo de desarrollo:</strong> {item.development_hours} horas
                </p>
                {item.files_modified && (
                  <p className="text-sm text-gray-600">
                    <strong>Archivos modificados:</strong> {item.files_modified}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DynamicChangelogDisplay;

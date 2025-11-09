'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  progress: number;
  eta: string;
  is_published: boolean;
}

const DynamicRoadmapDisplay: React.FC = () => {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublishedItems();
  }, []);

  const loadPublishedItems = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .select('*')
        .eq('is_published', true)
        .order('progress', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading roadmap items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay items publicados en el roadmap actualmente.
      </div>
    );
  }

  // Group items by status
  const itemsByStatus = items.reduce((acc, item) => {
    if (!acc[item.status]) {
      acc[item.status] = [];
    }
    acc[item.status].push(item);
    return acc;
  }, {} as Record<string, RoadmapItem[]>);

  const statusConfig = {
    'En Desarrollo Activo': { border: 'border-blue-500', badge: 'bg-green-100 text-green-800', badgeText: '🟢 En Progreso' },
    'Planificado para Iniciar': { border: 'border-indigo-500', badge: 'bg-gray-100 text-gray-700', badgeText: '📋 Próximamente' },
    'En Planeación': { border: 'border-purple-500', badge: 'bg-purple-100 text-purple-700', badgeText: '🚀 Próximas Funcionalidades' }
  };

  const categoryColors = {
    'Integración': 'bg-blue-100 text-blue-800',
    'Nueva Funcionalidad': 'bg-purple-100 text-purple-800',
    'Marketing': 'bg-green-100 text-green-800',
    'IA & Automatización': 'bg-purple-100 text-purple-800',
    'Crecimiento': 'bg-green-100 text-green-800',
    'Plataforma': 'bg-orange-100 text-orange-800',
    'SEO & Analytics': 'bg-green-100 text-green-800',
    'Marketing Digital': 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-12">
      {Object.entries(statusConfig).map(([status, config]) => {
        const statusItems = itemsByStatus[status];
        if (!statusItems || statusItems.length === 0) return null;

        return (
          <div key={status} className={`border-l-4 ${config.border} pl-8`}>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-gray-900">{status}</h2>
              <span className={`px-4 py-1 rounded-full text-sm font-semibold ${config.badge} ${status === 'En Desarrollo Activo' ? 'animate-pulse' : ''}`}>
                {config.badgeText}
              </span>
            </div>

            <div className="space-y-8">
              {statusItems.map(item => (
                <div key={item.id}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${categoryColors[item.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}`}>
                      {item.category}
                    </span>
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                      <span className="text-blue-500 text-xl">📊</span>
                      <div className="flex-1">
                        <strong>{item.title}</strong>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        {(item.progress > 0 || item.eta) && (
                          <div className="mt-2">
                            {item.progress > 0 && (
                              <span className="inline-block bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700 font-medium">
                                🎯 Progreso: {item.progress}%
                              </span>
                            )}
                            {item.eta && (
                              <span className="inline-block bg-yellow-50 px-3 py-1 rounded-full text-xs text-yellow-700 font-medium ml-2">
                                📅 ETA: {item.eta}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DynamicRoadmapDisplay;

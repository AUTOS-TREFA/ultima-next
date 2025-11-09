
'use client';

import React from 'react';
import type { ComparisonProps } from '../../types/landing-builder';

interface ComparisonInputPanelProps extends ComparisonProps {
    onPropsChange: React.Dispatch<React.SetStateAction<ComparisonProps>>;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const ComparisonInputPanel: React.FC<ComparisonInputPanelProps> = (props) => {
    const { headline, paragraph, features, items, color, onPropsChange } = props;

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onPropsChange(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureChange = (id: number, value: string) => {
        onPropsChange(prev => ({ ...prev, features: prev.features.map(f => f.id === id ? { ...f, name: value } : f) }));
    };

    const addFeature = () => {
        const newId = (features.length > 0 ? Math.max(...features.map(f => f.id)) : 0) + 1;
        onPropsChange(prev => ({ ...prev, features: [...prev.features, { id: newId, name: 'Nueva Característica' }] }));
    };
    
    const removeFeature = (id: number) => {
        onPropsChange(prev => ({ ...prev, features: prev.features.filter(f => f.id !== id) }));
    };

    const handleItemNameChange = (id: number, value: string) => {
        onPropsChange(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? { ...i, name: value } : i) }));
    };
    
    const handleItemValueChange = (itemId: number, featureId: number, value: string) => {
        onPropsChange(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === itemId ? {
                ...item,
                values: { ...item.values, [featureId]: value }
            } : item)
        }));
    };

    const addItem = () => {
        if (items.length >= 4) return;
        const newId = (items.length > 0 ? Math.max(...items.map(i => i.id)) : 0) + 1;
        onPropsChange(prev => ({ ...prev, items: [...prev.items, { id: newId, name: `Producto ${newId}`, values: {} }] }));
    };

    const removeItem = (id: number) => {
        if (items.length <= 1) return;
        onPropsChange(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
    };

    return (
        <div className="bg-white rounded-lg p-6 space-y-6 border border-slate-200 shadow-sm">
             <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Contenido Principal</h2>
                <div>
                    <label htmlFor="headline" className="block text-sm font-medium text-slate-600 mb-2">Título</label>
                    <input type="text" name="headline" id="headline" value={headline} onChange={handleContentChange} className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="paragraph" className="block text-sm font-medium text-slate-600 mb-2">Párrafo</label>
                    <textarea name="paragraph" id="paragraph" rows={3} value={paragraph} onChange={handleContentChange} className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                 <div>
                    <label htmlFor="color" className="block text-sm font-medium text-slate-600 mb-2">Color de Fondo</label>
                    <input type="color" name="color" id="color" value={color} onChange={(e) => onPropsChange(p => ({...p, color: e.target.value}))} className="w-full h-10 p-1 bg-slate-50 border border-slate-300 rounded-md cursor-pointer" />
                </div>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-900">Características (Filas)</h2>
                    <button onClick={addFeature} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-[#FF6801] hover:bg-[#E65C00]">Añadir</button>
                </div>
                <div className="space-y-2">
                {features.map(feature => (
                    <div key={feature.id} className="flex items-center space-x-2">
                        <input type="text" value={feature.name} onChange={(e) => handleFeatureChange(feature.id, e.target.value)} className="flex-grow bg-white border border-slate-300 rounded-md shadow-sm py-1.5 px-2" />
                        <button onClick={() => removeFeature(feature.id)} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-md"><TrashIcon /></button>
                    </div>
                ))}
                </div>
            </div>
            
            <hr className="border-slate-200" />

            <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-900">Productos (Columnas)</h2>
                    <button onClick={addItem} disabled={items.length >= 4} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-[#FF6801] hover:bg-[#E65C00] disabled:bg-orange-300">Añadir</button>
                </div>
                 <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                             <div className="flex justify-between items-center">
                                <input type="text" value={item.name} onChange={(e) => handleItemNameChange(item.id, e.target.value)} className="w-full bg-white font-semibold border-slate-300 rounded-md shadow-sm py-1 px-2 mr-2" />
                                {items.length > 1 && <button onClick={() => removeItem(item.id)} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-md"><TrashIcon /></button>}
                            </div>
                            <div className="space-y-2">
                                {features.map(feature => (
                                    <div key={feature.id}>
                                        <label className="text-xs font-medium text-slate-500">{feature.name}</label>
                                        <input type="text" value={item.values[feature.id] || ''} onChange={(e) => handleItemValueChange(item.id, feature.id, e.target.value)} className="mt-1 w-full bg-white border border-slate-300 rounded-md shadow-sm py-1 px-2 text-sm" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
            </div>

        </div>
    );
};

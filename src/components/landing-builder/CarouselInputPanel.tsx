
'use client';

import React, { useState } from 'react';
import type { CarouselProps, CarouselImage } from '../../types/landing-builder';

interface CarouselInputPanelProps extends CarouselProps {
    onPropsChange: React.Dispatch<React.SetStateAction<CarouselProps>>;
}

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


export const CarouselInputPanel: React.FC<CarouselInputPanelProps> = (props) => {
    const { headline, paragraph, images, color, onPropsChange } = props;
    const [imageUrl, setImageUrl] = useState('');

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onPropsChange(prev => ({ ...prev, [name]: value }));
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onPropsChange(prev => ({ ...prev, color: e.target.value }));
    };

    const addImageFromUrl = () => {
        if (imageUrl.trim() === '') return;
        const newImage: CarouselImage = {
            id: Date.now(),
            src: imageUrl.trim()
        };
        onPropsChange(prev => ({ ...prev, images: [...prev.images, newImage] }));
        setImageUrl('');
    };

    const addImageFromFile = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const newImage: CarouselImage = {
                id: Date.now(),
                src: reader.result as string
            };
            onPropsChange(prev => ({ ...prev, images: [...prev.images, newImage] }));
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            addImageFromFile(e.target.files[0]);
        }
    };

    const removeImage = (id: number) => {
        onPropsChange(prev => ({ ...prev, images: prev.images.filter(img => img.id !== id) }));
    };

    return (
        <div className="bg-white rounded-lg p-6 space-y-6 border border-slate-200 shadow-sm">
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Contenido del Carrusel</h2>
                <div>
                    <label htmlFor="headline" className="block text-sm font-medium text-slate-600 mb-2">Título</label>
                    <input type="text" name="headline" id="headline" value={headline} onChange={handleContentChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="paragraph" className="block text-sm font-medium text-slate-600 mb-2">Párrafo</label>
                    <textarea name="paragraph" id="paragraph" rows={3} value={paragraph} onChange={handleContentChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                 <div>
                    <label htmlFor="color" className="block text-sm font-medium text-slate-600 mb-2">Color de Fondo</label>
                    <input type="color" name="color" id="color" value={color} onChange={handleColorChange}
                        className="w-full h-10 p-1 bg-slate-50 border border-slate-300 rounded-md cursor-pointer" />
                </div>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900">Imágenes</h2>
                <div className="space-y-2">
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-slate-600">Añadir por URL</label>
                    <div className="flex space-x-2">
                        <input type="text" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."
                            className="flex-grow bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                        <button onClick={addImageFromUrl} className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6801] hover:bg-[#E65C00]">Añadir</button>
                    </div>
                </div>
                <div className="text-center">
                    <span className="text-sm text-slate-500">o</span>
                </div>
                <div>
                     <label htmlFor="file-upload-carousel" className="w-full text-center cursor-pointer bg-slate-50 rounded-md border-2 border-dashed border-slate-300 p-4 block hover:bg-slate-100">
                        <span className="text-sm font-medium text-[#FF6801]">Sube un archivo</span>
                        <input id="file-upload-carousel" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </label>
                </div>

                <div className="space-y-2 pt-4">
                    {images.map(image => (
                        <div key={image.id} className="flex items-center bg-slate-50 p-2 rounded-md border border-slate-200">
                           <img src={image.src} alt="Thumbnail" className="w-10 h-10 object-cover rounded-md" />
                           <p className="flex-grow ml-3 text-xs text-slate-600 truncate">{image.src}</p>
                           <button onClick={() => removeImage(image.id)} className="ml-2 p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-md">
                                <TrashIcon />
                           </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

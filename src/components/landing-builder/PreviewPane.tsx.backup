import React, { useState } from 'react';
import { DeviceSwitcher } from './DeviceSwitcher';
import { CodeBlock } from './CodeBlock';

type Device = 'desktop' | 'tablet' | 'mobile';

interface PreviewPaneProps {
    title: string;
    description: string;
    onSave: () => void;
    jsxString: string;
    children: React.ReactNode;
}

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3l-4-4-4 4z" />
    </svg>
);

export const PreviewPane: React.FC<PreviewPaneProps> = ({ title, description, onSave, jsxString, children }) => {
    const [device, setDevice] = useState<Device>('desktop');

    const widthClasses: Record<Device, string> = {
        desktop: 'w-full',
        tablet: 'w-[768px]',
        mobile: 'w-[375px]',
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <div className="flex items-center gap-4">
                    <DeviceSwitcher activeDevice={device} onDeviceChange={setDevice} />
                    <button onClick={onSave} className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6801] hover:bg-[#E65C00]">
                        <SaveIcon /> Guardar
                    </button>
                </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-200 flex justify-center items-start">
                <div className={`${widthClasses[device]} mx-auto transition-all duration-300 ease-in-out @container`}>
                    <div className="shadow-lg">
                        {children}
                    </div>
                </div>
            </div>
            <CodeBlock jsxString={jsxString} />
        </div>
    );
};

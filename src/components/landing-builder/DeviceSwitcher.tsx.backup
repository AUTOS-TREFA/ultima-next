import React from 'react';

type Device = 'desktop' | 'tablet' | 'mobile';

interface DeviceSwitcherProps {
    activeDevice: Device;
    onDeviceChange: (device: Device) => void;
}

const DesktopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const TabletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const MobileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);


const DeviceButton: React.FC<{
    device: Device,
    activeDevice: Device,
    onClick: (device: Device) => void,
    children: React.ReactNode
}> = ({ device, activeDevice, onClick, children }) => {
    const isActive = device === activeDevice;
    return (
        <button
            onClick={() => onClick(device)}
            className={`p-2 rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 focus-visible:ring-[#FF6801]
                ${isActive ? 'bg-[#FF6801] text-white' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'}
            `}
            aria-label={`Switch to ${device} view`}
        >
            {children}
        </button>
    );
}

export const DeviceSwitcher: React.FC<DeviceSwitcherProps> = ({ activeDevice, onDeviceChange }) => {
    return (
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            <DeviceButton device="desktop" activeDevice={activeDevice} onClick={onDeviceChange}>
                <DesktopIcon />
            </DeviceButton>
            <DeviceButton device="tablet" activeDevice={activeDevice} onClick={onDeviceChange}>
                <TabletIcon />
            </DeviceButton>
            <DeviceButton device="mobile" activeDevice={activeDevice} onClick={onDeviceChange}>
                <MobileIcon />
            </DeviceButton>
        </div>
    );
};

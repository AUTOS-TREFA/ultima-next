import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Save } from 'lucide-react';
import { AdminService } from '../services/AdminService'; // Assuming a function to get/set config will be here
import { toast } from 'sonner';

// We'll need to add functions to AdminService to handle config data
const ConfigService = {
    async getConfig() {
        // This function will need to be implemented fully
        // For now, it's a placeholder
        return [];
    },
    async updateConfig(key: string, value: any) {
        // This function will also need to be implemented
        console.log('Updating', key, value);
    }
};


const AdminConfigPage: React.FC = () => {
    const [config, setConfig] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // This will be replaced with a real service call
                const data = await AdminService.getAppConfig();
                setConfig(data);
                const initialEditingValues = data.reduce((acc: any, item: any) => {
                    acc[item.key] = JSON.stringify(item.value, null, 2);
                    return acc;
                }, {});
                setEditingValues(initialEditingValues);
            } catch (err) {
                setError('Failed to load application configuration.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleValueChange = (key: string, value: string) => {
        setEditingValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (key: string) => {
        try {
            const valueToSave = JSON.parse(editingValues[key]);
            await AdminService.updateAppConfig(key, valueToSave);
            toast.success(`Configuration for '${key}' saved successfully!`);
        } catch (e) {
            toast.error('Invalid JSON format. Please check your syntax.');
            console.error('Error saving config:', e);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>;
    }

    if (error) {
        return <div className="p-4 bg-red-100 text-red-800 rounded-md"><AlertTriangle className="inline w-5 h-5 mr-2"/>{error}</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">Marketing & Integrations Hub</h1>
            <p className="text-gray-600">
                This is the central hub for managing application settings, marketing tool integrations, and other dynamic configurations.
            </p>

            <div className="space-y-6">
                {config.map((item) => (
                    <div key={item.key} className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold text-gray-800 capitalize">{item.key.replace(/_/g, ' ')}</h2>
                        <p className="text-sm text-gray-500 mb-4">Key: <code>{item.key}</code></p>
                        <textarea
                            value={editingValues[item.key] || ''}
                            onChange={(e) => handleValueChange(item.key, e.target.value)}
                            className="w-full h-48 p-3 font-mono text-sm bg-gray-50 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => handleSave(item.key)}
                                className="inline-flex items-center gap-2 py-2 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
                            >
                                <Save className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminConfigPage;
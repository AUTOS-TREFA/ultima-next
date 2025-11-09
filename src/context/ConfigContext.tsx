'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface ConfigContextType {
  config: any;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('app_config')
        .select('*');
      
      if (error) {
        console.error('Error fetching config:', error);
      } else {
        const configObject = data.reduce((acc, row) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
        setConfig(configObject);
      }
      setLoading(false);
    };

    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

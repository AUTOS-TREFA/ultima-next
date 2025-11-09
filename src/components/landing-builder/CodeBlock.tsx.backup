import React, { useState, useEffect } from 'react';

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);


export const CodeBlock: React.FC<{ jsxString: string }> = ({ jsxString }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsxString).then(() => {
      setIsCopied(true);
    });
  };
  
  useEffect(() => {
    if(isCopied) {
        const timer = setTimeout(() => setIsCopied(false), 2000);
        return () => clearTimeout(timer);
    }
  }, [isCopied]);

  return (
    <div className="relative bg-slate-800">
      <button 
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-[#FF6801]"
        aria-label="Copiar código"
      >
        {isCopied ? <CheckIcon/> : <ClipboardIcon />}
      </button>
      <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
        <code className="language-jsx">{jsxString}</code>
      </pre>
    </div>
  );
};
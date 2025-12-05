import React, { useState } from "react";
import { motion } from "framer-motion";
import { Download, Check } from "lucide-react";

interface ExportButtonWithAnimationProps {
  animationState: string;
  setAnimationState: (state: string) => void;
}

const ExportButtonWithAnimation: React.FC<ExportButtonWithAnimationProps> = ({
  animationState,
  setAnimationState,
}) => {
  const handleExport = () => {
    setAnimationState("exporting");
    // Simulate export process
    setTimeout(() => {
      setAnimationState("complete");
      // Reset after showing success
      setTimeout(() => {
        setAnimationState("idle");
      }, 2000);
    }, 1500);
  };

  return (
    <motion.button
      onClick={handleExport}
      disabled={animationState === "exporting"}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
        animationState === "complete"
          ? "bg-green-500 text-white"
          : "bg-primary text-white hover:bg-primary/90"
      } ${
        animationState === "exporting"
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer"
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {animationState === "exporting" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        />
      )}
      {animationState === "complete" ? (
        <>
          <Check className="w-4 h-4" />
          <span>¡Exportado!</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>
            {animationState === "exporting" ? "Exportando..." : "Exportar"}
          </span>
        </>
      )}
    </motion.button>
  );
};

export default ExportButtonWithAnimation;

"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "../hooks/useOutsideClick";
import { branchData } from "../utils/constants";
import { MapPin, Phone } from "lucide-react";
import type { BranchesContent } from "../services/HomePageContentService";

interface BranchCard {
  title: string;
  description: string;
  src: string;
  phone: string;
  address: string;
  ctaText: string;
  ctaLink: string;
  content: () => React.ReactNode;
}

const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

interface BranchesSectionProps {
  content?: BranchesContent | null;
}

const BranchesSection: React.FC<BranchesSectionProps> = ({ content }) => {
  const [active, setActive] = useState<BranchCard | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  // Track when component is mounted (client-side) for portal rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Always use branchData to ensure all 4 branches are displayed
  const branchesContent: BranchesContent = {
    title: content?.title || "Nuestras Sucursales",
    subtitle: content?.subtitle || "Con presencia en 4 estados, nuestras sucursales ofrecen todos los servicios de compra, venta y financiamiento.",
    bottomNote: content?.bottomNote || "Ofrecemos reubicación sin costo entre sucursales el mismo día",
    branches: branchData // Always use all 4 branches from constants
  };

  // Transform branch data into card format
  const cards: BranchCard[] = branchesContent.branches.map((branch) => ({
    title: `TREFA ${branch.city}`,
    description: branch.city,
    src: branch.imageUrl,
    phone: branch.phone,
    address: branch.address,
    ctaText: "Cómo Llegar",
    ctaLink: branch.directionsUrl,
    content: () => (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">{branch.address}</p>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <a
            href={`tel:+52${branch.phone}`}
            className="text-sm text-primary-600 font-semibold hover:underline"
          >
            ({branch.phone.slice(0, 3)}) {branch.phone.slice(3, 6)}-{branch.phone.slice(6)}
          </a>
        </div>
        <div className="mt-4 aspect-video rounded-lg overflow-hidden">
          <iframe
            src={branch.mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Ubicación de ${branch.city}`}
          />
        </div>
      </div>
    ),
  }));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 w-full overflow-hidden bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight text-gray-900 mb-4">
            {branchesContent.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {branchesContent.subtitle}
          </p>
        </div>

        {/* Overlay */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 h-full w-full z-10"
            />
          )}
        </AnimatePresence>

        {/* Expanded Card Modal - Using Portal to render at document body */}
        {isMounted && createPortal(
          <AnimatePresence>
            {active ? (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setActive(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 9998,
                  }}
                />

                {/* Modal container */}
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 9999,
                    pointerEvents: 'none',
                  }}
                >
                  {/* Close button */}
                  <button
                    className="bg-white rounded-full shadow-xl hover:bg-gray-100 transition-colors border-2 border-gray-200"
                    onClick={() => setActive(null)}
                    aria-label="Cerrar"
                    style={{
                      position: 'fixed',
                      top: '1rem',
                      right: '1rem',
                      width: '48px',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10000,
                      pointerEvents: 'auto',
                    }}
                  >
                    <CloseIcon />
                  </button>

                  {/* Modal card */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    ref={ref}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      maxHeight: '85vh',
                      display: 'flex',
                      flexDirection: 'column',
                      pointerEvents: 'auto',
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      <img
                        src={active.src}
                        alt={active.title}
                        className="w-full h-48 sm:h-56 object-cover"
                      />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 p-4 sm:p-6">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl sm:text-2xl text-neutral-800">
                            {active.title}
                          </h3>
                          <p className="text-neutral-600 mt-1">
                            {active.description}
                          </p>
                        </div>

                        <a
                          href={active.ctaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm rounded-full font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors flex-shrink-0 shadow-sm"
                        >
                          {active.ctaText}
                        </a>
                      </div>
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="text-neutral-600">
                          {active.content()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </>
            ) : null}
          </AnimatePresence>,
          document.body
        )}

        {/* Branch Cards Grid */}
        <ul className="max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card) => (
            <li
              key={card.title}
              onClick={() => setActive(card)}
              className="p-4 flex flex-col rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg bg-white border border-gray-200"
            >
              <div className="flex gap-4 flex-col w-full">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={card.src}
                    alt={card.title}
                    className="h-48 w-full rounded-xl object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-neutral-800">
                      {card.title}
                    </h3>
                    <p className="text-neutral-600 text-sm">
                      {card.description}
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm rounded-full font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-sm">
                    Ver más
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Bottom Note */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600 bg-white p-4 rounded-lg inline-block shadow-sm border border-gray-200">
            {branchesContent.bottomNote}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BranchesSection;

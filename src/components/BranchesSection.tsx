"use client";

import React, { useEffect, useId, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

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
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-4">
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

        {/* Expanded Card */}
        <AnimatePresence>
          {active ? (
            <div className="fixed inset-0 grid place-items-center z-[100] p-4 sm:p-6 lg:p-8 bg-black/50">
              <motion.button
                key={`button-${active.title}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="flex absolute top-4 right-4 sm:top-6 sm:right-6 items-center justify-center bg-white rounded-full h-12 w-12 shadow-xl z-[110] hover:bg-gray-100 transition-colors border-2 border-gray-200"
                onClick={() => setActive(null)}
                aria-label="Cerrar"
              >
                <CloseIcon />
              </motion.button>
              <motion.div
                layoutId={`card-${active.title}-${id}`}
                ref={ref}
                className="w-full max-w-[500px] max-h-[85vh] sm:max-h-[calc(100vh-3rem)] lg:max-h-[90vh] flex flex-col bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative"
              >
                <motion.div layoutId={`image-${active.title}-${id}`}>
                  <img
                    src={active.src}
                    alt={active.title}
                    className="w-full h-64 lg:h-80 sm:rounded-tr-lg sm:rounded-tl-lg object-cover"
                  />
                </motion.div>

                <div className="flex-1 overflow-auto">
                  <div className="flex justify-between items-start p-6">
                    <div className="flex-1">
                      <motion.h3
                        layoutId={`title-${active.title}-${id}`}
                        className="font-bold text-2xl text-neutral-800 dark:text-neutral-200"
                      >
                        {active.title}
                      </motion.h3>
                      <motion.p
                        layoutId={`description-${active.description}-${id}`}
                        className="text-neutral-600 dark:text-neutral-400 mt-1"
                      >
                        {active.description}
                      </motion.p>
                    </div>

                    <motion.a
                      layoutId={`button-${active.title}-${id}`}
                      href={active.ctaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm rounded-full font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors flex-shrink-0 ml-4"
                    >
                      {active.ctaText}
                    </motion.a>
                  </div>
                  <div className="px-6 pb-6">
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-neutral-600 dark:text-neutral-400"
                    >
                      {active.content()}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        {/* Branch Cards Grid */}
        <ul className="max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card) => (
            <motion.li
              layoutId={`card-${card.title}-${id}`}
              key={card.title}
              onClick={() => setActive(card)}
              className="p-4 flex flex-col hover:bg-white rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg bg-white border border-gray-200"
            >
              <div className="flex gap-4 flex-col w-full">
                <motion.div layoutId={`image-${card.title}-${id}`} className="relative overflow-hidden rounded-xl">
                  <img
                    src={card.src}
                    alt={card.title}
                    className="h-48 w-full rounded-xl object-cover transition-transform duration-300 hover:scale-105"
                  />
                </motion.div>
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <motion.h3
                      layoutId={`title-${card.title}-${id}`}
                      className="font-bold text-lg text-neutral-800 dark:text-neutral-200"
                    >
                      {card.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${card.description}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-sm"
                    >
                      {card.description}
                    </motion.p>
                  </div>
                  <motion.button
                    layoutId={`button-${card.title}-${id}`}
                    className="px-4 py-2 text-sm rounded-full font-semibold bg-gray-100 hover:bg-primary-600 hover:text-white text-gray-800 transition-colors"
                  >
                    Ver más
                  </motion.button>
                </div>
              </div>
            </motion.li>
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

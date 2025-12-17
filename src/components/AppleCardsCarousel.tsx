"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "../lib/utils";
import Link from "next/link";

type Card = {
  title: string;
  category: string;
  src: string;
  description: string;
  link: string;
};

export const AppleCardsCarousel = ({
  items,
  className,
}: {
  items: Card[];
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div className="flex w-full overflow-x-scroll overscroll-x-auto py-10 md:py-20 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex flex-row justify-start gap-4 pl-4 max-w-7xl mx-auto">
          {items.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="last:pr-[5%] md:last:pr-[33%] rounded-3xl"
            >
              <Link href={item.link || '#'}>
                <Card
                  card={item}
                  index={index}
                  hovered={hoveredIndex}
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Card = ({
  card,
  index,
  hovered,
}: {
  card: Card;
  index: number;
  hovered: number | null;
}) => {
  return (
    <div
      className={cn(
        "rounded-3xl h-96 w-80 md:h-[500px] md:w-96 bg-gray-100 dark:bg-neutral-900 overflow-hidden flex flex-col items-start justify-start relative z-10 transition-all duration-300",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      <div className="absolute inset-0 z-0">
        <img
          src={card.src}
          alt={card.title}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      <div className="relative z-20 p-8 flex flex-col h-full justify-end">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/80 text-sm md:text-base font-medium mb-2"
        >
          {card.category}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-2xl md:text-3xl font-bold max-w-xs"
        >
          {card.title}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/70 text-sm md:text-base mt-2 max-w-xs"
        >
          {card.description}
        </motion.p>
      </div>
    </div>
  );
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: {
  height?: number | string;
  width?: number | string;
  src: string;
  className?: string;
  alt?: string;
  [key: string]: any;
}) => {
  const [isLoading, setLoading] = useState(true);
  return (
    <img
      className={cn(
        "transition duration-300",
        isLoading ? "blur-sm" : "blur-0",
        className
      )}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      alt={alt || "Background of a beautiful view"}
      {...rest}
    />
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';

const cardMotionTransition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
};

const nextRandomIndex = (currentIndex, totalCards) => {
  if (totalCards <= 1) {
    return currentIndex;
  }

  let nextIndex = currentIndex;

  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * totalCards);
  }

  return nextIndex;
};

const AnimatedHighlightGrid = ({
  rows = 3,
  columns = 4,
  mirrored = false,
  className,
  sx,
}) => {
  const totalCards = rows * columns;
  const cards = useMemo(() => Array.from({ length: totalCards }, (_, index) => index), [totalCards]);
  const [activeCardIndex, setActiveCardIndex] = useState(() => Math.floor(Math.random() * totalCards));
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveCardIndex((currentIndex) => nextRandomIndex(currentIndex, totalCards));
    }, 1000 + Math.random() * 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeCardIndex, isPaused, totalCards]);

  return (
    <Box
      className={className}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      sx={{
        width: '100%',
        maxWidth: 224,
        p: 1.2,
        borderRadius: '30px',
        border: '1px solid rgba(255,255,255,0.09)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)), radial-gradient(circle at center, rgba(168, 85, 247, 0.08), transparent 72%)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), 0 22px 44px rgba(2, 6, 23, 0.18)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        ...sx,
      }}
    >
      <Grid container columns={columns} spacing={1}>
        {cards.map((cardIndex) => {
          const isActive = cardIndex === activeCardIndex;

          return (
            <Grid key={cardIndex} size={1} sx={{ display: 'flex' }}>
              <Box
                component={motion.div}
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0.34,
                  scale: isActive ? 1.04 : 0.96,
                  y: isActive ? -3 : 0,
                }}
                transition={cardMotionTransition}
                sx={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: isActive
                    ? '1px solid rgba(214, 188, 255, 0.44)'
                    : '1px solid rgba(255,255,255,0.06)',
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(168, 85, 247, 0.34), rgba(110, 52, 196, 0.14)), rgba(12, 10, 24, 0.78)'
                    : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015)), rgba(8, 10, 16, 0.62)',
                  boxShadow: isActive
                    ? '0 0 0 1px rgba(168, 85, 247, 0.18), 0 18px 34px rgba(124, 58, 237, 0.28), 0 0 30px rgba(168, 85, 247, 0.24)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 18px rgba(2, 6, 23, 0.12)',
                  backdropFilter: 'blur(18px)',
                  WebkitBackdropFilter: 'blur(18px)',
                }}
              >
                <Box
                  component={motion.div}
                  initial={false}
                  animate={
                    isActive
                      ? {
                          opacity: isPaused ? 0.7 : [0.4, 0.86, 0.45],
                          scale: isPaused ? 1.02 : [1, 1.08, 1],
                        }
                      : {
                          opacity: 0,
                          scale: 0.92,
                        }
                  }
                  transition={{
                    duration: 1.35,
                    repeat: isActive && !isPaused ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                  sx={{
                    position: 'absolute',
                    inset: '18%',
                    borderRadius: '14px',
                    background:
                      'radial-gradient(circle, rgba(229, 214, 255, 0.9), rgba(168, 85, 247, 0.28) 48%, rgba(124, 58, 237, 0) 74%)',
                    filter: 'blur(8px)',
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  component={motion.div}
                  initial={false}
                  animate={
                    isActive
                      ? {
                          x: mirrored ? ['115%', '0%', '-115%'] : ['-115%', '0%', '115%'],
                          opacity: [0, 0.92, 0],
                        }
                      : {
                          x: mirrored ? '115%' : '-115%',
                          opacity: 0,
                        }
                  }
                  transition={{
                    duration: 1,
                    repeat: isActive && !isPaused ? Infinity : 0,
                    repeatDelay: 0.18,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 34%, rgba(168, 85, 247, 0.34) 64%, rgba(255,255,255,0.08))',
                    pointerEvents: 'none',
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    background:
                      'linear-gradient(145deg, rgba(255,255,255,0.12), transparent 36%)',
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default AnimatedHighlightGrid;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// local asset import (Vite handles image paths this way)
// adjust relative path: file lives in src/app/components, assets in src/assets
// TypeScript may not resolve these image modules without a tsconfig paths setup,
// so we silence the errors explicitly.
// @ts-expect-error
// import coverImage from '../../assets/cover.jpeg';
// @ts-expect-error
// import arrierCoverImage from '../../assets/arrier_cover.png';
export function BookCover() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [hover, setHover] = useState(false);

  const handleClick = () => {
    setOpening(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, rotateY: -90 }}
      transition={{ duration: 1 }}
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#e8e4db]"
      style={{
        transformOrigin: 'right center',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Arrière-plan doux et chaud (sans blanc) */}
      <div className="absolute inset-0">
        {/* Image de fond teintée beige/kaki */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(/assets/arrier_cover.png)`,
            filter: 'brightness(0.9) sepia(0.4) hue-rotate(10deg)',
          }}
        />
        
        {/* Dégradé d'ambiance lin et pierre */}
        
        {/* Effet de lumière douce (dorée, pas blanche) */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 20% 30%, rgba(242, 201, 121, 0) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(212, 175, 55, 0) 0%, transparent 30%)',
          }}
        />
      </div>

      {/* Particules de lumière (façon lucioles chaleureuses) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 5 + 3 + 'px',
              height: Math.random() * 5 + 3 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              background: 'rgba(234, 179, 8, 0.3)', // Or doux
              filter: 'blur(1px)',
              boxShadow: '0 0 8px rgba(234,179,8,0.2)',
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, Math.random() * 10 - 5, 0],
              opacity: [0, 0.6, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 12,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Book Container */}
      <motion.div 
        className="relative cursor-pointer z-10"
        onClick={handleClick}
        onHoverStart={() => setHover(true)}
        onHoverEnd={() => setHover(false)}
        style={{ perspective: '2500px' }}
        animate={opening ? { 
          scale: 1.3, 
          rotateY: 0, 
          opacity: 0,
          filter: 'brightness(1.1)'
        } : hover ? { 
          scale: 1.03, 
          rotate: [0, 0.5, -0.5, 0.2, 0],
          filter: 'drop-shadow(0 20px 25px rgba(85,80,70,0.2))'
        } : {}}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        onAnimationComplete={() => {
          if (opening) navigate('/login');
        }}
      >
        {/* Book Shadow chaleureuse */}
        <div className="absolute inset-0 bg-[#7a7468]/30 blur-2xl translate-y-6 translate-x-4 rounded-lg"></div>
        
        {/* Book Cover - Vert Sauge apaisant */}
        <div 
          className="relative w-[420px] h-[580px] rounded-r-xl shadow-xl border-y-2 border-r-2 border-[#8a9a8f]"
          style={{
            transform: 'rotateY(-8deg)',
            boxShadow: 'inset -5px 0 20px rgba(0,0,0,0.08), 15px 15px 35px rgba(60,65,60,0.2), 0 0 15px rgba(167,188,174,0.3)',
            background: 'linear-gradient(145deg, #a7bcae 0%, #c1d1c8 40%, #aebfbc 80%, #89a397 100%)',
          }}
        >
          {/* Texture de couverture aspect toile/lin */}
          <div 
            className="absolute inset-0 rounded-r-xl opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, rgba(80,100,85,0.1) 0px, rgba(80,100,85,0.1) 1px, transparent 1px, transparent 4px),
                               repeating-linear-gradient(-45deg, rgba(80,100,85,0.1) 0px, rgba(80,100,85,0.1) 1px, transparent 1px, transparent 4px)`,
            }}
          ></div>
          
          {/* Book Spine Effect - Ton sur ton */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#708678]/70 via-[#a7bcae]/80 to-transparent"></div>
          
          {/* Bordure décorative douce (Laiton/Or vieilli) */}
          <div className="absolute inset-5 rounded-r-lg border border-[#cdaa6a]/60"
            style={{
              boxShadow: 'inset 0 0 10px rgba(205,170,106,0.15), 0 0 5px rgba(205,170,106,0.1)',
            }}
          ></div>

          {/* Cover Content */}
          <div className="relative h-full p-10 flex flex-col">
            {/* Title - Gris chaud foncé pour la lisibilité */}
            <div className="text-center mb-6 mt-4">
              <h1 
                className="font-serif text-4xl tracking-widest mb-3"
                style={{
                  fontFamily: 'Georgia, serif',
                  textShadow: '1px 1px 2px rgba(255,255,255,0.2)',
                }}
              >
                <span style={{ color: '#0e7d83' }}>Smart</span><span style={{ color: '#95393e' }}>Carthage</span>
              </h1>
              <div className="h-px w-20 mx-auto bg-gradient-to-r from-transparent via-[#cdaa6a] to-transparent"></div>
            </div>

            {/* Mosaic Image - Filtre chaud et bordure fine */}
            <div className="flex-1 flex items-center justify-center mb-6 z-10">
              <div 
                className="w-full h-56 rounded-lg overflow-hidden"
                style={{
                  border: '2px solid #8f9e94',
                  boxShadow: '0 8px 20px rgba(40,50,45,0.15)',
                }}
              >
                <img 
                  src="/assets/cover.jpeg"
                  alt="Livre ancien"
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.95) contrast(0.9) sepia(0.2)' }}
                />
              </div>
            </div>

            {/* Subtitle - Doux et élégant */}
            <div className="text-center mb-8">
              <p 
                className="font-serif text-lg italic tracking-wide mb-3 text-[#4a524c]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Les Origines de l'Éducation
              </p>
              <p className="font-sans text-xs tracking-[0.2em] text-[#5e6660] uppercase font-medium">
                Votre avenir est notre responsabilité 
              </p>
            </div>

            {/* Author */}
            <div className="text-center mb-2">
              <div className="h-px w-12 mx-auto mb-4 bg-[#a4ae9d]"></div>
              <p 
                className="font-serif text-xl tracking-wider text-[#3a3f3b]"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Achref Jnayeh
              </p>
            </div>

            {/* Éléments de coin décoratifs - Discrets */}
            <div className="absolute top-6 left-6 w-6 h-6 border-l border-t border-[#cdaa6a] rounded-tl"></div>
            <div className="absolute top-6 right-6 w-6 h-6 border-r border-t border-[#cdaa6a] rounded-tr"></div>
            <div className="absolute bottom-6 left-6 w-6 h-6 border-l border-b border-[#cdaa6a] rounded-bl"></div>
            <div className="absolute bottom-6 right-6 w-6 h-6 border-r border-b border-[#cdaa6a] rounded-br"></div>
          </div>

          {/* Book Pages Edge Effect - Couleur papier ivoire, pas blanc */}
          <div 
            className="absolute right-0 top-1 bottom-1 w-1.5 bg-[#eae4d3] rounded-r border-l border-[#9eab9f]"
            style={{ boxShadow: '-2px 0 4px rgba(0,0,0,0.05)' }}
          ></div>
          <div className="absolute right-0.5 top-2 bottom-2 w-px bg-[#d1cab5]"></div>
          <div className="absolute right-1 top-3 bottom-3 w-px bg-[#d1cab5]"></div>
        </div>

        

        {/* Hover Instruction - Bulle couleur lin chaud */}
        <motion.div 
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 text-[#5c5446] text-sm text-center whitespace-nowrap font-medium px-5 py-2.5 bg-[#f0ebd8]/90 backdrop-blur-md rounded-full border border-[#e3dac1]"
          style={{ boxShadow: '0 4px 15px rgba(90,85,75,0.1)' }}
          animate={{ 
            opacity: hover ? 1 : 0,
            y: hover ? 0 : -8,
            scale: hover ? 1 : 0.95
          }}
          transition={{ duration: 0.3 }}
        >
          Cliquez pour ouvrir le livre
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
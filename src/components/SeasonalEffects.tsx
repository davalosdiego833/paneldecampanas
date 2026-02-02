import React from 'react';
import { motion } from 'framer-motion';

interface Props {
    effect?: string;
    themeId?: string;
}

const SeasonalEffects: React.FC<Props> = ({ effect, themeId }) => {
    if (effect === 'nieve' || themeId?.includes('diciembre')) {
        return (
            <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
                {[...Array(50)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute text-white"
                        initial={{
                            top: -20,
                            left: `${Math.random() * 100}%`,
                            opacity: Math.random() * 0.7 + 0.3
                        }}
                        animate={{
                            top: '110vh',
                            rotate: 360,
                            x: [0, Math.random() * 50 - 25, 0]
                        }}
                        transition={{
                            duration: Math.random() * 5 + 5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 5
                        }}
                    >
                        ❄
                    </motion.div>
                ))}
            </div>
        );
    }

    if (effect === 'sol' || themeId?.includes('julio')) {
        return <div className="sun-glow" />;
    }

    // Add more as needed (Confetti, Hearts, etc.)
    return null;
};

export default SeasonalEffects;

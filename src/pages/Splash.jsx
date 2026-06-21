import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin } from "lucide-react";

export default function Splash({ onComplete }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #1a1a3e 0%, #2d1b69 40%, #4a1a8a 70%, #1a1a3e 100%)"
          }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mb-6"
          >
            <div className="relative w-24 h-24 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-3xl bg-white/10 backdrop-blur-sm"
              />
              <Shield className="w-12 h-12 text-white relative z-10" />
              <MapPin className="w-6 h-6 text-emerald-400 absolute top-2 right-2 z-10" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl font-bold text-white tracking-widest mb-2"
          >
            SENTRYA
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-white/60 text-sm font-light tracking-widest uppercase"
          >
            Travel Safety Intelligence Network
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="mt-12 w-32 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
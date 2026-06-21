import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import SOSModal from "./SOSModal";

export default function SOSButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        className="w-16 h-16 rounded-full bg-danger text-white flex flex-col items-center justify-center shadow-lg shadow-red-500/40 border-4 border-white/20 relative"
        style={{ boxShadow: "0 0 0 0 rgba(239,68,68,0.4)" }}
        animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0.4)", "0 0 0 12px rgba(239,68,68,0)"] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <AlertTriangle className="w-6 h-6" />
        <span className="text-[9px] font-bold tracking-widest mt-0.5">SOS</span>
      </motion.button>

      <SOSModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
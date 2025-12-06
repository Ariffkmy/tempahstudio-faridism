import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { HTMLMotionProps } from "framer-motion";

export const HeroHighlight = ({ children, className, ...props }: HTMLMotionProps<"div">) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.4, 0.0, 0.2, 1],
      }}
      className={cn("bg-gradient-to-br from-indigo-50 via-white to-cyan-100 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 p-8 rounded-2xl", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const Highlight = ({ children, className, ...props }: HTMLMotionProps<"span">) => {
  return (
    <motion.span
      initial={{ backgroundPositionX: 0 }}
      animate={{ backgroundPositionX: "100%" }}
      transition={{
        duration: 3,
        ease: "linear",
        repeat: Infinity,
        repeatType: "mirror",
      }}
      className={cn(
        "relative inline-block bg-gradient-to-r from-[#0F977C] via-[#16A085] to-[#1ABC9C] bg-[length:200%_auto] px-2 py-1 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_4px_rgba(0,0,0,0.3),0_4px_8px_rgba(0,0,0,0.1)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.span>
  );
};

import { motion } from "framer-motion";

export function MockHeroSection() {
  return (
    <section className="relative py-16 bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="relative max-w-6xl mx-auto">
            <img
              src="/mockhero.png"
              alt="RAYA Studio Hero"
              className="relative w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 blur-3xl opacity-40 scale-125 -z-10"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";

export function MockHeroSection() {
  return (
    <section className="relative py-24 md:py-16 bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="relative max-w-6xl mx-auto">
             <div>
              <h2 className="text-4xl font-bold mb-4 text-primary">Kami automasikan semua <span className="pencil-underline">kerja manual anda</span></h2>
             </div>
            <img
              src="/mockhero.png"
              alt="RAYA Studio Hero"
              className="relative w-full h-auto z-10"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-400 via-green-500 to-cyan-400 blur-3xl opacity-20 scale-10"></div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

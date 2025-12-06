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
          <div className="max-w-4xl mx-auto">
            <img
              src="/mockhero.png"
              alt="RAYA Studio Hero"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

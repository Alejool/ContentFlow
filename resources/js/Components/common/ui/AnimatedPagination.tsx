import { motion } from "framer-motion";

interface AnimatedPaginationProps {
  total: number;
  current: number;
  onPageChange: (index: number) => void;
  autoAdvance?: boolean;
  autoAdvanceDuration?: number;
}

export default function AnimatedPagination({
  total,
  current,
  onPageChange,
  autoAdvance = false,
  autoAdvanceDuration = 5,
}: AnimatedPaginationProps) {
  return (
    <div className="flex justify-center gap-3">
      {Array.from({ length: total }).map((_, index) => (
        <motion.button
          key={index}
          onClick={() => onPageChange(index)}
          className={`relative h-3 rounded-full transition-all duration-300 ${
            index === current
              ? "w-12 bg-primary-600"
              : "w-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
          }`}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          aria-label={`Ir a página ${index + 1}`}
        >
          {index === current && autoAdvance && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-600"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: autoAdvanceDuration, ease: "linear" }}
              key={`progress-${current}`}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}

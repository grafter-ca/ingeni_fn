import { motion } from "framer-motion";
import { Search, ShoppingCart, CreditCard, Package } from "lucide-react";

const steps = [
  { 
    icon: Search,     
    step: "01", 
    title: "Browse",     
    description: "Explore thousands of curated products across every category with instant filters." 
  },
  { 
    icon: ShoppingCart,
    step: "02", 
    title: "Add",        
    description: "Secure your items to cart in one smooth click with live synchronization." 
  },
  { 
    icon: CreditCard,   
    step: "03", 
    title: "Checkout", 
    description: "Frictionless Mobile Money & card transactions protected end-to-end." 
  },
  { 
    icon: Package,      
    step: "04", 
    title: "Receive",    
    description: "Real-time telemetry tracking straight to your door, anywhere." 
  },
];

const HowItWorks = () => (
  <section className="px-4 sm:px-6 py-8 bg-white dark:bg-[#0a0a0a] border-b border-zinc-200 dark:border-zinc-800/80 relative overflow-hidden transition-colors">
    
    {/* Ambient Glow Effects */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[200px] sm:h-[350px] bg-blue-600/10 dark:bg-blue-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />

    <div className="max-w-7xl mx-auto relative z-10">
      
      {/* Section Header */}
      <motion.div 
        className="text-center md:text-left mb-12 sm:mb-16 flex flex-col items-center md:items-start"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 mb-4 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 dark:text-gray-300 font-semibold">
            Protocol Architecture
          </span>
        </div>
        
        <h2 className="font-poppins font-bold text-3xl sm:text-4xl md:text-5xl text-zinc-900 dark:text-white tracking-tight">
          How Ingeni Works
        </h2>
        <p className="font-poppins text-xs sm:text-sm text-zinc-500 dark:text-gray-400 mt-2 max-w-md font-light">
          Designed for absolute speed, clarity, and uncompromising reliability.
        </p>
      </motion.div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative">
        
        {/* Connector Line for Desktop */}
        <div className="hidden lg:block absolute top-[34%] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 dark:via-blue-500/40 to-transparent pointer-events-none" />

        {steps.map(({ icon: Icon, step, title, description }, i) => (
          <motion.div
            key={step}
            className="flex flex-col items-center text-center p-6 sm:p-8 rounded-[2rem] bg-zinc-50/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/10 relative group hover:border-blue-500/40 hover:bg-white dark:hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -6 }}
          >
            {/* Step Identifier Badge */}
            <div className="absolute top-5 right-5 font-mono text-xs text-blue-600/70 dark:text-blue-400/70 font-black tracking-widest bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              {step}
            </div>

            {/* Interactive Icon Container */}
            <div className="relative mb-6 mt-2">
              <motion.div
                className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl"
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
              />
              <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-white/15 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-lg shadow-black/5 dark:shadow-2xl">
                <Icon size={28} className="transition-transform duration-300 group-hover:rotate-6" />
              </div>
            </div>

            {/* Content Details */}
            <h3 className="font-poppins font-bold text-zinc-900 dark:text-white text-lg sm:text-xl tracking-wide mb-2">
              {title}
            </h3>
            
            <p className="font-poppins text-xs sm:text-sm text-zinc-500 dark:text-gray-400 leading-relaxed font-light">
              {description}
            </p>

            {/* Bottom Accent Line on Hover */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-blue-600 dark:bg-blue-500 rounded-full group-hover:w-1/2 transition-all duration-300" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
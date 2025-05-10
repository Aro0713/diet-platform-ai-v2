import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/background.jpg)' }}
    >
      <Head>
        <title>Diet Care Platform</title>
      </Head>

      {/* Tło zaciemniające */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-0" />

      {/* Zawartość */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-24">
        {/* Logo animowane */}
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.5 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 2 }}
          className="mb-6"
        >
          <Image
            src="/logo-dietcare.png"
            alt="Logo Diet Care Platform"
            width={180}
            height={180}
            className="mx-auto"
          />
        </motion.div>

        {/* Powitanie */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="text-4xl md:text-5xl font-bold text-gray-900"
        >
          Witaj w Diet Care Platform
        </motion.h1>

        {/* Motto */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
          className="max-w-2xl mt-6 text-gray-800 text-lg md:text-xl"
        >
          Twoja dieta. Twoje zdrowie. Twój plan.
          <br />
          Diet Care Platform pomaga Ci otrzymać jadłospis dopasowany do Twojego stanu zdrowia, stylu życia i celów.
          <br />
          Tworzony przez specjalistów, wspierany technologią — z myślą o Tobie.
        </motion.p>

        {/* Podpis i pióro */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.5, duration: 1 }}
          className="mt-12 relative"
        >
          <Image
            src="/podpis-rekomendacja.png"
            alt="Rekomenduję Edyta Stroczyńska"
            width={460}
            height={100}
            className="mx-auto"
          />
  <motion.img
  src="/pioro.png"
  alt="Pióro"
  initial={{ x: 200, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ delay: 4.6, duration: 1.2 }}
  className="absolute left-[60%] top-4 w-12"
/>


        </motion.div>

        {/* Przyciski */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6.2, duration: 0.8 }}
          className="mt-10 flex flex-col md:flex-row gap-4"
        >
          <Link
            href="/panel"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-blue-700 transition text-center"
          >
            Wejdź jako Lekarz / Dietetyk
          </Link>
          <Link
            href="/pacjent"
            className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg shadow hover:bg-green-700 transition text-center"
          >
            Wejdź jako Pacjent
          </Link>
        </motion.div>
      </div>

      {/* Znak wodny */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 6.8, duration: 2 }}
        className="absolute inset-0 flex items-center justify-center z-0 select-none"
      >
        <h1 className="text-8xl font-bold text-gray-400">Diet Care Platform</h1>
      </motion.div>
    </div>
  );
}

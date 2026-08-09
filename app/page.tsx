import Image from "next/image";
import BookingCalendar from "./components/BookingCalendar";
import ContactSection from "./components/ContactSection";
import HeroImage from "./components/HeroImage";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="px-6 py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl dark:text-zinc-50">
          GEOCABAÑAS - Punta del Diablo
        </h1>
      </header>

      <section
        aria-label="Imagen principal"
        className="relative flex h-[60vh] w-full items-center justify-center bg-zinc-300 dark:bg-zinc-800"
      >
        <div className="flex h-full w-full flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <HeroImage />
        </div>
      </section>

      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
        <h2 className="mb-6 text-center text-xl font-semibold text-black dark:text-zinc-50">
          Disponibilidad
        </h2>
        <BookingCalendar />
        <ContactSection />
      </main>
    </div>
  );
}

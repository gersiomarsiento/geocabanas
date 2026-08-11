import Image from "next/image";
import BookingCalendar from "./components/BookingCalendar";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import HeroImage from "./components/HeroImage";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="p-3 md:p-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl dark:text-zinc-50">
          GEOCABAÑAS
        </h1>
      </header>

      <section
        aria-label="Imagen principal"
        className="relative flex h-[calc(100svh-60px)] w-full items-center justify-center bg-zinc-300 dark:bg-zinc-800"
      >
        <div className="flex h-full w-full flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <HeroImage />
        </div>
        <a href="#reservar-section" className="scroll-smooth z-0 bg-white font-bold text-black py-2 px-4 border border-black rounded-md absolute bottom-10">
          RESERVAR
        </a>
      </section>

      <main className="mx-auto w-full max-w-lg flex-1 px-3 md:px-6 py-6">
        <h2 className="mb-6 text-center text-xl font-semibold text-black dark:text-zinc-50">
          Hacé tu reserva
        </h2>
        <BookingCalendar />
      </main>
      <ContactSection />
      <Footer />
    </div>
  );
}

import Image from "next/image";
import BookingCalendar from "./components/BookingCalendar";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import HeroImage from "./components/HeroImage";
import AboutSection from "./components/AboutSection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <header className="p-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-black md:text-4xl">
          GEOCABAÑAS
        </h1>
      </header>

      <section
        aria-label="Imagen principal"
        className="relative flex h-[calc(100svh-60px)] w-full items-center justify-center bg-black"
      >
        <div className="flex h-full w-full flex-col items-center gap-2 text-white">
          <HeroImage />
        </div>
        <a
          href="#reservar-button"
          className="scroll-smooth z-0 bg-white font-bold text-black py-2 px-4 border border-black rounded-md absolute bottom-10"
        >
          RESERVAR
        </a>
      </section>

      <AboutSection />

      <main
        id="reservar-button"
        className="mx-auto w-full max-w-lg md:max-w-360 flex-1 px-3 md:px-6 py-6"
      >
        <h2 className="mb-6 text-center text-xl font-semibold text-black">
          Hacé tu reserva
        </h2>
        <BookingCalendar />
      </main>
      <ContactSection />
      <Footer />
    </div>
  );
}

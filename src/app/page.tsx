import AboutSection from "@/components/Home/About";
import Hero from "@/components/Home/Hero";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <AboutSection />
      <Footer />
    </>
  );
}

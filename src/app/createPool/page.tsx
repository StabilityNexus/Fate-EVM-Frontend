import CreateFatePoolForm from "@/components/Forms/CreateFatePool";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";

export default function CreateFatePoolPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <CreateFatePoolForm />
      </div>
      <Footer />
    </>
  );
}

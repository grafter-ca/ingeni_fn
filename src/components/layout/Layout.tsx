import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CookieConsent from "../common/CookieConsent";

const Layout = () => {
  return (
    <main className="min-h-screen bg-gray-900 font-poppins flex flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />

      {/* Global Cookie Consent Banner */}
      <CookieConsent />
    </main>
  );
};

export default Layout;
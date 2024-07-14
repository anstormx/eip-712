import { Inter } from "next/font/google";
import Providers from "@/components/provider";
import "./globals.css";
import { ToastContainer, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Message Verifier</title>
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen text-white bg-[#28282B]">
            <Navbar />
            {children}
            <Footer />
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              newestOnTop={false}
              hideProgressBar={true}
              rtl={false}
              pauseOnFocusLoss
              pauseOnHover
              theme="dark"
              stacked 
              transition={Flip}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}

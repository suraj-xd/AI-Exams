import { type AppType } from "next/dist/shared/lib/utils";
import CommandK from "~/components/cmdk/CmdK";
import { Toaster } from 'react-hot-toast';
import "~/styles/globals.css";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Component {...pageProps} />
      <CommandK />
      <Toaster />
    </>
  )
};

export default MyApp;

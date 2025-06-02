import dynamic from 'next/dynamic';

const HomePage = dynamic(() => import('~/components/Pages/HomePage'), {
  ssr: false, // This will only render on the client-side
});
export default function Home() {
  return (
    <>
      <HomePage/>        
    </>
  );
}

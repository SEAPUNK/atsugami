import Browse from "@/features/app/Browse";
import { Toaster } from "@/ui/sonner";

function App() {
  return (
    <>
      <Browse />
      <Toaster position="bottom-left" toastOptions={{ duration: 2000 }} />
    </>
  );
}

export default App;

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Убираем все ошибки консоли
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Unrecognized feature') || 
      args[0]?.includes?.('sandbox') ||
      args[0]?.includes?.('beforeinstallprompt')) {
    return;
  }
  originalError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);

import { useEffect } from "react";
import { useGame } from "./lib/stores/useGame";
import { useAudio } from "./lib/stores/useAudio";

// Main App component that serves as a wrapper for our p5.js game
function App() {
  useEffect(() => {
    // Redirect to the standalone game page
    window.location.href = "/index.html";
  }, []);

  return (
    <div className="loading">
      <p>Loading game...</p>
    </div>
  );
}

export default App;

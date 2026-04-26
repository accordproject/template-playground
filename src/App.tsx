import { useEffect } from "react";
import { ExecutionService } from "./services/ExecutionService";

function App() {
  useEffect(() => {
    const service = new ExecutionService();
    service.test();
  }, []);

  return <div>Check console for output</div>;
}

export default App;
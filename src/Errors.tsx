import useAppStore from './store';

function Errors() {
  const error = useAppStore((state) => state.error)
  return <div className="error">
    <pre>{error}</pre>
  </div>;
}

export default Errors;

import "./index.css";

export default function Loading() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-text text-label-caps">Carregando...</p>
    </div>
  );
}

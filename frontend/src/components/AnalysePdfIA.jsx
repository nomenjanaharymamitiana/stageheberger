import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function AnalysePdfIA({
  numRef,
  authHeaders = {},
}) {
  const [analyse, setAnalyse] = useState("");
  const [titre, setTitre] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState(false);

  async function lancerAnalyse() {
    if (!numRef) {
      setErreur("La référence du document est manquante.");
      return;
    }

    setOuvert(true);
    setLoading(true);
    setErreur("");
    setAnalyse("");
    setTitre("");

    try {
      const response = await fetch(
        `${API_URL}/api/v1/assistant/analyser-pdf/${encodeURIComponent(numRef)}`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail || "Impossible d'analyser ce document."
        );
      }

      setTitre(data.titre || numRef);
      setAnalyse(data.analyse || "Aucune analyse n'a été retournée.");
    } catch (error) {
      setErreur(
        error.message ||
          "Une erreur est survenue pendant l'analyse du PDF."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="analyse-pdf">
      <button
        type="button"
        className="analyse-pdf__button"
        onClick={lancerAnalyse}
        disabled={loading || !numRef}
      >
        {loading ? "Analyse en cours..." : "✨ Analyser avec l'IA"}
      </button>

      {ouvert && (
        <section
          className="analyse-pdf__panel"
          aria-live="polite"
        >
          <div className="analyse-pdf__header">
            <div>
              <h2>Analyse intelligente</h2>
              {titre && (
                <p className="analyse-pdf__subtitle">
                  {titre}
                </p>
              )}
            </div>

            <button
              type="button"
              className="analyse-pdf__close"
              onClick={() => setOuvert(false)}
              aria-label="Fermer l'analyse"
            >
              ×
            </button>
          </div>

          {loading && (
            <div className="analyse-pdf__loading">
              <div className="analyse-pdf__spinner" />
              <p>
                L'IA lit le document et identifie les
                informations importantes...
              </p>
              <small>
                Le temps d'attente dépend de la taille du PDF
                et de la disponibilité du service IA.
              </small>
            </div>
          )}

          {erreur && (
            <div className="analyse-pdf__error" role="alert">
              <strong>Analyse impossible</strong>
              <p>{erreur}</p>
              <button
                type="button"
                onClick={lancerAnalyse}
                disabled={loading}
              >
                Réessayer
              </button>
            </div>
          )}

          {!loading && !erreur && analyse && (
            <>
              <div className="analyse-pdf__content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {analyse}
                </ReactMarkdown>
              </div>

              <div className="analyse-pdf__footer">
                <span>
                  Analyse générée par l'IA à partir du document.
                </span>

                <button
                  type="button"
                  onClick={() => window.print()}
                >
                  Imprimer
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
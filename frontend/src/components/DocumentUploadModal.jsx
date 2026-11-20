import { useState } from "react";
import "./DocumentUpload.css";

const API_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:8000"
}/api/v1/documents`;

const CATEGORIES = [
  { value: "Nomination", label: "Nomination" },
  { value: "Finance", label: "Finance" },
  { value: "Développement", label: "Développement" },
];

const getToday = () => {
  const date = new Date();
  return new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);
};

const INITIAL_FORM = {
  num_ref: "",
  date_num: getToday(),
  cat: "Nomination",
  annee_redac: String(new Date().getFullYear()),
  title: "",
};

function getCredentials(user) {
  let storedUser = {};

  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    storedUser = {};
  }

  return {
    token: localStorage.getItem("token"),
    matricule:
      user?.im ||
      user?.im_dag_rh ||
      user?.matricule ||
      storedUser?.im ||
      storedUser?.im_dag_rh ||
      storedUser?.matricule ||
      localStorage.getItem("im"),
  };
}

function getErrorMessage(result, status) {
  const detail = result?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (typeof result?.message === "string") {
    return result.message;
  }

  if (status === 401) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }

  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'effectuer cette action.";
  }

  if (status === 413) {
    return "Le fichier est trop volumineux.";
  }

  if (status >= 500) {
    return "Le serveur rencontre un problème. Réessayez plus tard.";
  }

  return "Une erreur est survenue. Vérifiez les informations et réessayez.";
}

function DocumentUploadModal({ onClose, onSuccess, user }) {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
    setDuplicateInfo(null);
  };

  const closeModal = () => {
    if (!loading && !analyzing) {
      onClose?.();
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearMessages();
  };

  // Sélection du fichier et préremplissage automatique.
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    clearMessages();

    const isPDF =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setFile(null);
      event.target.value = "";
      setError("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setFile(selectedFile);

    if (!isPDF) {
      setSuccessMessage(
        "Fichier sélectionné. Le préremplissage automatique est disponible pour les PDF."
      );
      return;
    }

    const { token } = getCredentials(user);

    if (!token) {
      setError(
        "Votre session a expiré. Veuillez vous reconnecter."
      );
      return;
    }

    setAnalyzing(true);

    try {
      const body = new FormData();
      body.append("file", selectedFile);

      const response = await fetch(`${API_URL}/pre-remplir`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, response.status)
        );
      }

      setFormData((previous) => ({
        ...previous,
        num_ref: result.num_ref ?? previous.num_ref,
        cat: CATEGORIES.some(
          (item) => item.value === result.cat
        )
          ? result.cat
          : previous.cat,
        annee_redac:
          result.annee_redac != null
            ? String(result.annee_redac)
            : previous.annee_redac,
        title: result.title ?? previous.title,
      }));

      setSuccessMessage(
        "Analyse terminée. Vérifiez les informations avant l'enregistrement."
      );
    } catch (err) {
      setError(
        err.message || "L'analyse du fichier a échoué."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // Enregistrement du document.
  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();

    if (!file) {
      setError("Veuillez sélectionner un document.");
      return;
    }

    if (!formData.num_ref.trim()) {
      setError("Veuillez saisir le numéro de référence.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Veuillez saisir le titre du document.");
      return;
    }

    if (!formData.annee_redac.trim()) {
      setError("Veuillez saisir l'année de rédaction.");
      return;
    }

    if (analyzing) {
      setError("Veuillez attendre la fin de l'analyse.");
      return;
    }

    const { token, matricule } = getCredentials(user);

    if (!token) {
      setError(
        "Votre session a expiré. Veuillez vous reconnecter."
      );
      return;
    }

    if (!matricule) {
      setError("Le matricule de l'utilisateur est introuvable.");
      return;
    }

    setLoading(true);

    try {
      const body = new FormData();

      body.append("num_ref", formData.num_ref.trim());
      body.append("date_num", formData.date_num);
      body.append("cat", formData.cat);
      body.append("annee_redac", formData.annee_redac);
      body.append("title", formData.title.trim());
      body.append("im_dag_rh", matricule);
      body.append("file", file);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-User-IM": matricule,
        },
        body,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail = result?.detail;

        if (
          response.status === 409 &&
          detail &&
          typeof detail === "object" &&
          [
            "DUPLICATE_DOCUMENT",
            "DUPLICATE_REFERENCE",
          ].includes(detail.code)
        ) {
          setDuplicateInfo({
            code: detail.code,
            message:
              detail.message ||
              "Ce document existe déjà dans la base de données.",
            num_ref: detail.num_ref || "",
            title: detail.title || "",
          });

          return;
        }

        throw new Error(
          getErrorMessage(result, response.status)
        );
      }

      setSuccessMessage(
        "Le document a été enregistré avec succès."
      );

      onSuccess?.(result);
      onClose?.();
    } catch (err) {
      setError(
        err.message ||
          "L'enregistrement du document a échoué."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    clearMessages();

    const input = document.getElementById("document-file");

    if (input) {
      input.value = "";
    }
  };

  return (
    <div
      className="document-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <section
        className="document-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-modal-title"
      >
        <header className="document-modal-header">
          <div className="document-heading-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M12 18v-6" />
              <path d="m9 15 3-3 3 3" />
            </svg>
          </div>

          <div className="document-heading-copy">
            <h2 id="document-modal-title">
              Ajouter un document
            </h2>

            <p>
              Complétez les informations pour intégrer le
              document à vos archives.
            </p>
          </div>

          <button
            type="button"
            className="document-close-button"
            onClick={closeModal}
            disabled={loading || analyzing}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="document-modal-body">
            <div className="document-form-grid">
              {/* Colonne de gauche */}
              <div className="document-form-column">
                <div className="document-form-group">
                  <label htmlFor="document-file">
                    Fichier du document <span>*</span>
                  </label>

                  <label
                    className={`document-dropzone ${
                      file ? "has-file" : ""
                    }`}
                    htmlFor="document-file"
                  >
                    <span className="document-upload-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 16V4" />
                        <path d="m7 9 5-5 5 5" />
                        <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
                      </svg>
                    </span>

                    <strong>
                      {file
                        ? "Choisir un autre fichier"
                        : "Sélectionnez votre document"}
                    </strong>

                    <span>
                      PDF, JPG ou PNG · 10 Mo maximum
                    </span>

                    <input
                      id="document-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={handleFileChange}
                      disabled={loading || analyzing}
                    />
                  </label>

                  {file && (
                    <div className="document-file-card">
                      <span className="document-pdf-icon">
                        PDF
                      </span>

                      <div className="document-file-meta">
                        <strong title={file.name}>
                          {file.name}
                        </strong>

                        <span>
                          {(file.size / (1024 * 1024)).toFixed(2)} Mo
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={removeFile}
                        disabled={loading || analyzing}
                        aria-label="Retirer le fichier"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  {analyzing && (
                    <div
                      className="document-inline-status info"
                      role="status"
                    >
                      <span className="document-spinner" />
                      <span>
                        Analyse du document en cours…
                      </span>
                    </div>
                  )}
                </div>

                <div className="document-form-group">
                  <label htmlFor="num_ref">
                    Numéro de référence <span>*</span>
                  </label>

                  <input
                    id="num_ref"
                    name="num_ref"
                    value={formData.num_ref}
                    onChange={handleChange}
                    placeholder="Ex. : 035-26/REG/HM"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="document-form-group">
                  <label htmlFor="title">
                    Titre du document <span>*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Saisissez le titre du document"
                    required
                  />
                </div>
              </div>

              {/* Colonne de droite */}
              <div className="document-form-column">
                <div className="document-form-group">
                  <label htmlFor="cat">
                    Catégorie <span>*</span>
                  </label>

                  <select
                    id="cat"
                    name="cat"
                    value={formData.cat}
                    onChange={handleChange}
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="document-form-group">
                  <label htmlFor="annee_redac">
                    Année de rédaction <span>*</span>
                  </label>

                  <input
                    id="annee_redac"
                    name="annee_redac"
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.annee_redac}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="document-form-group">
                  <label htmlFor="date_num">
                    Date de numérisation <span>*</span>
                  </label>

                  <input
                    id="date_num"
                    name="date_num"
                    type="date"
                    value={formData.date_num}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="document-form-note">
                  <span className="document-note-icon">i</span>

                  <p>
                    Vérifiez les informations préremplies avant
                    de confirmer l'enregistrement.
                  </p>
                </div>

                {duplicateInfo && (
                  <div
                    className="document-alert duplicate"
                    role="alert"
                  >
                    <div className="document-alert-symbol">
                      !
                    </div>

                    <div className="document-alert-content">
                      <h3>
                        {duplicateInfo.code ===
                        "DUPLICATE_DOCUMENT"
                          ? "Document déjà enregistré"
                          : "Référence déjà utilisée"}
                      </h3>

                      <p>{duplicateInfo.message}</p>

                      {(duplicateInfo.title ||
                        duplicateInfo.num_ref) && (
                        <div className="document-existing-record">
                          {duplicateInfo.title && (
                            <strong>
                              {duplicateInfo.title}
                            </strong>
                          )}

                          {duplicateInfo.num_ref && (
                            <span>
                              Référence : {duplicateInfo.num_ref}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="document-alert-footnote">
                        Aucun nouveau document n'a été enregistré.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="document-alert-dismiss"
                      onClick={() => setDuplicateInfo(null)}
                      aria-label="Fermer l'alerte"
                    >
                      ×
                    </button>
                  </div>
                )}

                {error && (
                  <div
                    className="document-inline-status error"
                    role="alert"
                  >
                    <span className="document-status-symbol">
                      !
                    </span>

                    <span>{error}</span>
                  </div>
                )}

                {successMessage && (
                  <div
                    className="document-inline-status success"
                    role="status"
                  >
                    <span className="document-status-symbol">
                      ✓
                    </span>

                    <span>{successMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <footer className="document-modal-footer">
            <button
              type="button"
              className="document-button secondary"
              onClick={closeModal}
              disabled={loading || analyzing}
            >
              Annuler
            </button>

            <button
              type="submit"
              className="document-button primary"
              disabled={loading || analyzing}
            >
              {loading ? (
                <>
                  <span className="document-spinner light" />
                  Enregistrement…
                </>
              ) : (
                "Enregistrer le document"
              )}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default DocumentUploadModal;
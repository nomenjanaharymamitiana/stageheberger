import React, { useState, useEffect, useCallback } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/theme.css";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentEditModal from "../components/DocumentEditModal";
import Parametres from "./Parametres";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:8000"
}/api/v1/documents`;

const CATEGORIES = [
  {
    id: "Nomination",
    icon: "bi-person-badge-fill",
    color: "#6366f1",
    bg: "#e0e7ff",
    darkBg: "rgba(99, 102, 241, 0.2)",
  },
  {
    id: "Finance",
    icon: "bi-cash-coin",
    color: "#10b981",
    bg: "#d1fae5",
    darkBg: "rgba(16, 185, 129, 0.2)",
  },
  {
    id: "Développement",
    icon: "bi-graph-up-arrow",
    color: "#f59e0b",
    bg: "#fef3c7",
    darkBg: "rgba(245, 158, 11, 0.2)",
  },
];

const buttonStyle = {
  borderRadius: "7px",
  padding: "7px 10px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontSize: "12px",
  fontWeight: "600",
};

export default function Dashboard({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);

  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("tableau");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] =
    useState("compte");

  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [trashDocuments, setTrashDocuments] = useState([]);
  const [historyDocuments, setHistoryDocuments] = useState([]);
  const [favoriteDocuments, setFavoriteDocuments] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [restoringRef, setRestoringRef] = useState(null);
  const [downloadingRef, setDownloadingRef] = useState(null);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // États pour l'analyse IA du PDF
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState("");
  const [aiAnalysisError, setAiAnalysisError] = useState("");

  const theme = {
    bg: darkMode ? "#0f172a" : "#f8fafc",
    sidebarBg: darkMode ? "#1e293b" : "#ffffff",
    cardBg: darkMode ? "#1e293b" : "#ffffff",
    textPrimary: darkMode ? "#f8fafc" : "#0f172a",
    textSecondary: darkMode ? "#94a3b8" : "#64748b",
    border: darkMode ? "#334155" : "#e2e8f0",
    hoverBg: darkMode ? "#334155" : "#f1f5f9",
    inputBg: darkMode ? "#0f172a" : "#ffffff",
    accent: "#3b82f6",
  };

  const getAuthHeaders = useCallback(() => {
    const token =
      localStorage.getItem("token") ||
      user?.im ||
      user?.im_dag_rh ||
      "";

    return {
      Authorization: `Bearer ${token}`,
      "X-User-IM": token,
    };
  }, [user]);

  const handleUpdateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const extractDocuments = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.documents)) return data.documents;
    return [];
  };

  const getApiError = async (response) => {
    let message = `Erreur HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") message = data.detail;
      else if (typeof data?.message === "string") message = data.message;
      else if (Array.isArray(data?.detail)) {
        message = data.detail.map((item) => item.msg || JSON.stringify(item)).join("\n");
      }
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {}
    }
    return message;
  };

  // Chargement global
  const fetchAllDocuments = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const data = await response.json();
      setAllDocuments(extractDocuments(data));
    } catch (error) {
      console.error("Erreur récupération globale :", error);
    }
  }, [getAuthHeaders]);

  const fetchDocuments = useCallback(
    async (category = selectedCategory) => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/`;
        if (category) {
          url = `${API_BASE_URL}/search?cat=${encodeURIComponent(category)}`;
        }
        const response = await fetch(url, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(await getApiError(response));
        const data = await response.json();
        setDocuments(extractDocuments(data));
      } catch (error) {
        console.error("Erreur récupération des documents :", error);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, selectedCategory]
  );

  const fetchMyDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const data = await response.json();
      setDocuments(extractDocuments(data));
    } catch (error) {
      console.error("Erreur récupération de mes documents :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/trash`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const data = await response.json();
      setTrashDocuments(extractDocuments(data));
    } catch (error) {
      console.error("Erreur corbeille :", error);
    }
  };

  // Récupérer l'historique de consultation
  const fetchHistoryDocuments = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/historique`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const data = await response.json();
      setHistoryDocuments(extractDocuments(data));
    } catch (error) {
      console.error("Erreur historique :", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Récupérer les documents favoris / importants
  const fetchFavoriteDocuments = async () => {
    setFavoritesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/favoris`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiError(response));
      const data = await response.json();
      setFavoriteDocuments(extractDocuments(data));
    } catch (error) {
      console.error("Erreur récupération favoris :", error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  // Basculer l'état Favori / Important (avec encodage sécurisé de la référence)
  const handleToggleImportant = async (numRef, e) => {
    e.stopPropagation();
    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(numRef)}/favoris`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error(await getApiError(response));
      
      const updatedDoc = await response.json();

      // Mettre à jour tous les états locaux de documents de manière synchrone
      const updateList = (list) =>
        list.map((doc) =>
          doc.num_ref === numRef ? { ...doc, est_important: updatedDoc.est_important } : doc
        );

      setDocuments(updateList);
      setAllDocuments(updateList);
      setHistoryDocuments(updateList);
      
      // Actualiser la liste des favoris si l'onglet actif est les favoris
      if (activeTab === "favoris") {
        fetchFavoriteDocuments();
      } else {
        // Mettre à jour ou filtrer la liste locale des favoris
        if (!updatedDoc.est_important) {
          setFavoriteDocuments((prev) => prev.filter((d) => d.num_ref !== numRef));
        } else {
          fetchFavoriteDocuments();
        }
      }
    } catch (error) {
      alert(`Impossible de modifier le statut favori.\n${error.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete || isDeleting) return;
    const deletedRef = docToDelete.num_ref;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(deletedRef)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) {
        alert(await getApiError(response));
        return;
      }
      setDocToDelete(null);
      setDocuments((prev) => prev.filter((d) => d.num_ref !== deletedRef));
      setAllDocuments((prev) => prev.filter((d) => d.num_ref !== deletedRef));
      setFavoriteDocuments((prev) => prev.filter((d) => d.num_ref !== deletedRef));
      await fetchTrashDocuments();
    } catch (error) {
      console.error("Erreur suppression :", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (numRef) => {
    if (restoringRef) return;
    setRestoringRef(numRef);
    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(numRef)}/restore`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );
      if (!response.ok) throw new Error(await getApiError(response));
      setTrashDocuments((prev) => prev.filter((d) => d.num_ref !== numRef));
      await fetchAllDocuments();
      await fetchDocuments(selectedCategory);
      alert("Document restauré avec succès.");
    } catch (error) {
      alert(`Impossible de restaurer.\n${error.message}`);
    } finally {
      setRestoringRef(null);
    }
  };

  const handleDownload = async (doc) => {
    if (!doc?.num_ref) return;
    setDownloadingRef(doc.num_ref);
    let objectUrl = null;
    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/download`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error(await getApiError(response));
      const blob = await response.blob();
      objectUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      const safeTitle = String(doc.title || "document").replace(/[\\/:*?"<>|]+/g, "_");
      link.download = `${doc.num_ref}_${safeTitle}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(`Impossible de télécharger.\n${error.message}`);
    } finally {
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
      setDownloadingRef(null);
    }
  };

  const handleOpenPreview = async (doc) => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(doc);
    setPreviewLoading(true);
    setAiAnalysisOpen(false);
    setAiAnalysisResult("");
    setAiAnalysisError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/preview`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) throw new Error(await getApiError(response));
      const blobData = await response.blob();
      const fileBlob = new Blob([blobData], { type: "application/pdf" });
      setPreviewUrl(window.URL.createObjectURL(fileBlob));
    } catch (error) {
      alert(`Impossible d'afficher le document.\n${error.message}`);
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
    setPreviewLoading(false);
    setAiAnalysisOpen(false);
  };

  const handleRunAiAnalysis = async () => {
    if (!previewDoc?.num_ref || aiAnalysisLoading) return;
    setAiAnalysisLoading(true);
    setAiAnalysisError("");
    setAiAnalysisResult("");
    setAiAnalysisOpen(true);

    try {
      const baseUrlClean = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/$/, "");

      const response = await fetch(
        `${baseUrlClean}/api/v1/assistant/analyser-pdf/${encodeURIComponent(
          previewDoc.num_ref
        )}`,
        { method: "POST", headers: getAuthHeaders() }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data.detail === "string" ? data.detail : `Erreur HTTP ${response.status}`);
      }
      setAiAnalysisResult(data.analyse || "Aucune analyse retournée.");
    } catch (error) {
      setAiAnalysisError(error.message || "Impossible d'effectuer l'analyse.");
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const getDaysRemaining = (dateSuppression) => {
    if (!dateSuppression) return null;
    const deletedDate = new Date(dateSuppression);
    if (Number.isNaN(deletedDate.getTime())) return null;
    const expirationDate = new Date(deletedDate);
    expirationDate.setDate(expirationDate.getDate() + 30);
    const remainingTime = expirationDate.getTime() - Date.now();
    if (remainingTime <= 0) return 0;
    return Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
  };

  const searchedDocuments = allDocuments.filter((doc) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [doc.num_ref, doc.title, doc.cat, doc.annee_redac, doc.format].some(
      (val) => val && String(val).toLowerCase().includes(query)
    );
  });

  const displayedDocuments = searchQuery.trim() ? searchedDocuments : documents;

  useEffect(() => {
    fetchAllDocuments();
    fetchDocuments(null);
    fetchTrashDocuments();
    fetchFavoriteDocuments();
  }, [fetchAllDocuments, fetchDocuments]);

  const navButtonStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "11px 14px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: isActive ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
    color: isActive ? "#ffffff" : theme.textSecondary,
    fontWeight: isActive ? "600" : "500",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "14px",
  });

  const cardStyle = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
  };

  const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" };
  const thStyle = { padding: "12px 14px", backgroundColor: theme.bg, borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, whiteSpace: "nowrap" };
  const tdStyle = { padding: "12px 14px", borderBottom: `1px solid ${theme.border}`, color: theme.textPrimary };
  const iconButtonStyle = { ...buttonStyle, backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, color: theme.textPrimary };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.textPrimary,
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          backgroundColor: theme.sidebarBg,
          borderRight: `1px solid ${theme.border}`,
          width: "260px",
          minWidth: "260px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ padding: "20px 18px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoGed} alt="Logo" style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover" }} />
            <div>
              <h1 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>GED District</h1>
              <p style={{ fontSize: "12px", color: theme.textSecondary, margin: 0 }}>Haute Matsiatra</p>
            </div>
          </div>

          <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              onClick={() => { setActiveTab("tableau"); setSearchQuery(""); fetchDocuments(null); }}
              style={navButtonStyle(activeTab === "tableau")}
            >
              <i className="bi bi-grid-1x2-fill" /> Tableau de bord
            </button>

            <button
              onClick={() => { setActiveTab("documents"); fetchMyDocuments(); }}
              style={navButtonStyle(activeTab === "documents")}
            >
              <i className="bi bi-folder-fill" /> Mes Documents
            </button>

            {/* ONGLET FAVORIS */}
            <button
              onClick={() => { setActiveTab("favoris"); fetchFavoriteDocuments(); }}
              style={navButtonStyle(activeTab === "favoris")}
            >
              <i className="bi bi-star-fill" style={{ color: "#f59e0b" }} /> Favoris
            </button>

            <button
              onClick={() => { setActiveTab("historique"); fetchHistoryDocuments(); }}
              style={navButtonStyle(activeTab === "historique")}
            >
              <i className="bi bi-clock-history" /> Historique
            </button>

            <button
              onClick={() => { setActiveTab("corbeille"); fetchTrashDocuments(); }}
              style={navButtonStyle(activeTab === "corbeille")}
            >
              <i className="bi bi-trash3-fill" /> Corbeille
              {trashDocuments.length > 0 && (
                <span style={{ marginLeft: "auto", borderRadius: "20px", padding: "2px 7px", fontSize: "11px", backgroundColor: "#ef4444", color: "#fff" }}>
                  {trashDocuments.length}
                </span>
              )}
            </button>

            <div>
              <button
                onClick={() => { setIsSettingsOpen(!isSettingsOpen); setActiveTab("parametres"); }}
                style={{ ...navButtonStyle(activeTab === "parametres"), justifyContent: "space-between" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <i className="bi bi-gear-fill" /> Paramètres
                </span>
                <i className={`bi bi-chevron-${isSettingsOpen ? "up" : "down"}`} />
              </button>

              {isSettingsOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px", paddingLeft: "28px" }}>
                  {[
                    { id: "compte", label: "Mon Compte", icon: "bi-person" },
                    { id: "password", label: "Sécurité", icon: "bi-shield-lock" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { setActiveTab("parametres"); setActiveSettingsSubTab(sub.id); }}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", border: "none",
                        backgroundColor: activeTab === "parametres" && activeSettingsSubTab === sub.id ? theme.hoverBg : "transparent",
                        color: activeSettingsSubTab === sub.id ? theme.textPrimary : theme.textSecondary,
                        cursor: "pointer", fontSize: "12px", textAlign: "left",
                      }}
                    >
                      <i className={`bi ${sub.icon}`} /> {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{ ...buttonStyle, width: "100%", padding: "12px 14px", marginTop: "16px", border: "none", backgroundColor: "#3b82f6", color: "#ffffff", boxShadow: "0 4px 12px rgba(59,130,246,0.3)" }}
            >
              <i className="bi bi-plus-lg" /> Nouveau Document
            </button>
          </nav>
        </div>

        <div style={{ padding: "16px", borderTop: `1px solid ${theme.border}`, fontSize: "12px", color: theme.textSecondary }}>
          <p style={{ margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }} /> En Ligne
          </p>
          <span>v1.3.0 - Pro</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header style={{ backgroundColor: theme.sidebarBg, padding: "14px 28px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}`, color: theme.textPrimary, borderRadius: "50%", width: "36px", height: "36px", cursor: "pointer" }}
            >
              <i className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-stars-fill"}`} />
            </button>

            <div style={{ width: "1px", height: "24px", backgroundColor: theme.border }} />

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: theme.hoverBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700" }}>
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : "A"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong>{user?.prenom || "Agent"} {user?.nom || ""}</strong>
                <span style={{ color: theme.textSecondary, fontSize: "11px", display: "block" }}>{user?.type_user || "Gestionnaire"}</span>
              </div>
            </div>

            <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: theme.textSecondary }} title="Déconnexion">
              <i className="bi bi-box-arrow-right" />
            </button>
          </div>
        </header>

        <main style={{ padding: "28px", flex: 1, overflowY: "auto" }}>
          {activeTab === "tableau" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", margin: "0 0 4px" }}>Bonjour {user?.prenom || "Administrateur"} !</h2>
                  <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>Plateforme de gestion et d'archivage sécurisée</p>
                </div>
              </div>

              {/* LISTE DES DOCUMENTS AVEC BOUTON ÉTOILE (EST_IMPORTANT) */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0 }}>Documents Administratifs</h3>
                </div>

                {loading ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary, padding: "20px" }}>Chargement...</p>
                ) : displayedDocuments.length === 0 ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary, padding: "20px" }}>Aucun document trouvé.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: "50px", textAlign: "center" }}>Favori</th>
                          <th style={thStyle}>Référence</th>
                          <th style={thStyle}>Titre</th>
                          <th style={thStyle}>Catégorie</th>
                          <th style={thStyle}>Année</th>
                          <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedDocuments.map((doc) => (
                          <tr key={doc.num_ref}>
                            <td style={{ ...tdStyle, textAlign: "center" }}>
                              <button
                                onClick={(e) => handleToggleImportant(doc.num_ref, e)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "18px",
                                  color: doc.est_important ? "#f59e0b" : "#cbd5e1",
                                  padding: "4px",
                                  transition: "color 0.2s"
                                }}
                                title={doc.est_important ? "Retirer des favoris" : "Marquer comme important"}
                              >
                                <i className={`bi bi-star${doc.est_important ? "-fill" : ""}`} />
                              </button>
                            </td>
                            <td style={{ ...tdStyle, fontWeight: "700" }}>{doc.num_ref}</td>
                            <td style={tdStyle}>{doc.title}</td>
                            <td style={tdStyle}>
                              <span style={{ padding: "4px 8px", borderRadius: "12px", backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}` }}>
                                {doc.cat}
                              </span>
                            </td>
                            <td style={tdStyle}>{doc.annee_redac || "-"}</td>
                            <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                              <button onClick={() => handleDownload(doc)} style={{ ...buttonStyle, color: "#10b981", border: "1px solid #a7f3d0", marginRight: "5px" }} title="Télécharger">
                                <i className="bi bi-download" />
                              </button>
                              <button onClick={() => handleOpenPreview(doc)} style={iconButtonStyle} title="Aperçu">
                                <i className="bi bi-eye" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ONGLET : MES DOCUMENTS */}
          {activeTab === "documents" && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>Mes Documents Importés</h2>
              <div style={cardStyle}>
                {documents.length === 0 ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary }}>Aucun document créé.</p>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: "50px", textAlign: "center" }}>Favori</th>
                        <th style={thStyle}>Référence</th>
                        <th style={thStyle}>Titre</th>
                        <th style={thStyle}>Catégorie</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.num_ref}>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button
                              onClick={(e) => handleToggleImportant(doc.num_ref, e)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                                color: doc.est_important ? "#f59e0b" : "#cbd5e1",
                                padding: "4px"
                              }}
                              title={doc.est_important ? "Retirer des favoris" : "Marquer comme important"}
                            >
                              <i className={`bi bi-star${doc.est_important ? "-fill" : ""}`} />
                            </button>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: "700" }}>{doc.num_ref}</td>
                          <td style={tdStyle}>{doc.title}</td>
                          <td style={tdStyle}>{doc.cat}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <button onClick={() => handleDownload(doc)} style={{ ...buttonStyle, color: "#10b981", marginRight: "4px" }}><i className="bi bi-download" /></button>
                            <button onClick={() => handleOpenPreview(doc)} style={{ ...iconButtonStyle, marginRight: "4px" }}><i className="bi bi-eye" /></button>
                            <button onClick={() => setDocToEdit(doc)} style={{ ...iconButtonStyle, marginRight: "4px" }}><i className="bi bi-pencil" /></button>
                            <button onClick={() => setDocToDelete(doc)} style={{ ...buttonStyle, color: "#ef4444", backgroundColor: "#fef2f2" }}><i className="bi bi-trash" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ONGLET : FAVORIS / IMPORTANTS */}
          {activeTab === "favoris" && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>Documents Favoris & Importants</h2>
              <div style={cardStyle}>
                {favoritesLoading ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary }}>Chargement des favoris...</p>
                ) : favoriteDocuments.length === 0 ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary }}>Aucun document marqué comme favori.</p>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: "50px", textAlign: "center" }}>Favori</th>
                        <th style={thStyle}>Référence</th>
                        <th style={thStyle}>Titre</th>
                        <th style={thStyle}>Catégorie</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {favoriteDocuments.map((doc) => (
                        <tr key={doc.num_ref}>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button
                              onClick={(e) => handleToggleImportant(doc.num_ref, e)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                                color: "#f59e0b",
                                padding: "4px"
                              }}
                              title="Retirer des favoris"
                            >
                              <i className="bi bi-star-fill" />
                            </button>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: "700" }}>{doc.num_ref}</td>
                          <td style={tdStyle}>{doc.title}</td>
                          <td style={tdStyle}>{doc.cat}</td>
                          <td style={{ ...tdStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                            <button onClick={() => handleDownload(doc)} style={{ ...buttonStyle, color: "#10b981", border: "1px solid #a7f3d0", marginRight: "5px" }} title="Télécharger">
                              <i className="bi bi-download" />
                            </button>
                            <button onClick={() => handleOpenPreview(doc)} style={iconButtonStyle} title="Aperçu">
                              <i className="bi bi-eye" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ONGLET : HISTORIQUE DE CONSULTATION */}
          {activeTab === "historique" && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>Historique de Consultation</h2>
              <div style={cardStyle}>
                {historyLoading ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary }}>Chargement de l'historique...</p>
                ) : historyDocuments.length === 0 ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary }}>Aucun document consulté récemment.</p>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={{ ...thStyle, width: "50px", textAlign: "center" }}>Favori</th>
                        <th style={thStyle}>Référence</th>
                        <th style={thStyle}>Titre</th>
                        <th style={thStyle}>Catégorie</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyDocuments.map((doc) => (
                        <tr key={doc.num_ref}>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button
                              onClick={(e) => handleToggleImportant(doc.num_ref, e)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "18px",
                                color: doc.est_important ? "#f59e0b" : "#cbd5e1",
                                padding: "4px"
                              }}
                            >
                              <i className={`bi bi-star${doc.est_important ? "-fill" : ""}`} />
                            </button>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: "700" }}>{doc.num_ref}</td>
                          <td style={tdStyle}>{doc.title}</td>
                          <td style={tdStyle}>{doc.cat}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <button onClick={() => handleOpenPreview(doc)} style={iconButtonStyle}>
                              <i className="bi bi-eye" /> Consulter à nouveau
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ONGLET : CORBEILLE */}
          {activeTab === "corbeille" && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "20px" }}>Corbeille</h2>
              <div style={cardStyle}>
                {trashDocuments.length === 0 ? (
                  <p style={{ textAlign: "center", color: theme.textSecondary }}>La corbeille est vide.</p>
                ) : (
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Référence</th>
                        <th style={thStyle}>Titre</th>
                        <th style={thStyle}>Jours restants</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashDocuments.map((doc) => {
                        const daysLeft = getDaysRemaining(doc.date_suppression);
                        return (
                          <tr key={doc.num_ref}>
                            <td style={tdStyle}>{doc.num_ref}</td>
                            <td style={tdStyle}>{doc.title}</td>
                            <td style={tdStyle}>{daysLeft !== null ? `${daysLeft} jours` : "-"}</td>
                            <td style={{ ...tdStyle, textAlign: "right" }}>
                              <button onClick={() => handleRestore(doc.num_ref)} style={{ ...buttonStyle, color: "#10b981" }}>Restaurer</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {activeTab === "parametres" && (
            <Parametres
              user={user}
              onUpdateUser={handleUpdateUser}
              activeSubTab={activeSettingsSubTab}
              setActiveSubTab={setActiveSettingsSubTab}
              getAuthHeaders={getAuthHeaders}
              theme={theme}
            />
          )}
        </main>
      </div>

      {/* MODALE APERÇU + ANALYSE IA */}
      {previewDoc && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: "15px" }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", width: "92%", height: "88%", maxWidth: "1100px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", backgroundColor: theme.sidebarBg, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>Aperçu : {previewDoc.title} ({previewDoc.num_ref})</h3>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button type="button" onClick={handleRunAiAnalysis} disabled={aiAnalysisLoading} style={{ ...buttonStyle, backgroundColor: "#6366f1", color: "#ffffff", border: "none" }}>
                  <i className="bi bi-stars" /> {aiAnalysisLoading ? "Analyse IA..." : "Analyser avec l'IA"}
                </button>
                <button onClick={() => handleDownload(previewDoc)} style={{ ...buttonStyle, backgroundColor: "#10b981", color: "#ffffff", border: "none" }}>
                  <i className="bi bi-download" /> Télécharger
                </button>
                <button onClick={handleClosePreview} style={{ background: "none", border: "none", color: theme.textPrimary, cursor: "pointer", fontSize: "18px" }}><i className="bi bi-x-lg" /></button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: "flex", position: "relative", backgroundColor: theme.bg }}>
              <div style={{ flex: 1, height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                {previewLoading ? <p>Chargement...</p> : previewUrl ? <iframe src={previewUrl} title="Aperçu" style={{ width: "100%", height: "100%", border: "none" }} /> : <p>Erreur d'affichage</p>}
              </div>

              {aiAnalysisOpen && (
                <div style={{ width: "420px", maxWidth: "100%", backgroundColor: theme.cardBg, borderLeft: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", zIndex: 10 }}>
                  <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>Analyse Intelligente IA</strong>
                    <button onClick={() => setAiAnalysisOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><i className="bi bi-x-lg" /></button>
                  </div>
                  <div style={{ flex: 1, padding: "16px", overflowY: "auto", fontSize: "13px" }}>
                    {aiAnalysisLoading && <p>Gemini analyse le document...</p>}
                    {aiAnalysisError && <p style={{ color: "#ef4444" }}>{aiAnalysisError}</p>}
                    {!aiAnalysisLoading && !aiAnalysisError && aiAnalysisResult && (
                      <div className="assistant-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysisResult}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION */}
      {docToDelete && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1200 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", padding: "24px", maxWidth: "420px", width: "100%" }}>
            <h3 style={{ color: "#ef4444", fontSize: "16px" }}>Mettre en corbeille</h3>
            <p style={{ fontSize: "13px" }}>Voulez-vous déplacer <strong>{docToDelete.title}</strong> vers la corbeille ?</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setDocToDelete(null)} style={buttonStyle}>Annuler</button>
              <button onClick={confirmDelete} style={{ ...buttonStyle, backgroundColor: "#ef4444", color: "#fff" }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <DocumentUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => { setIsModalOpen(false); await fetchAllDocuments(); await fetchDocuments(selectedCategory); await fetchFavoriteDocuments(); }}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {docToEdit && (
        <DocumentEditModal
          doc={docToEdit}
          onClose={() => setDocToEdit(null)}
          onSuccess={async () => { setDocToEdit(null); await fetchAllDocuments(); await fetchDocuments(selectedCategory); await fetchFavoriteDocuments(); }}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}
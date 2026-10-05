import React, { useState, useEffect } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/theme.css";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentEditModal from "../components/DocumentEditModal";
import Parametres from "./Parametres";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;

const CATEGORIES = [
  { id: "Nomination", icon: "bi-person-badge-fill", color: "#6366f1", bg: "#e0e7ff", darkBg: "rgba(99, 102, 241, 0.2)" },
  { id: "Finance", icon: "bi-cash-coin", color: "#10b981", bg: "#d1fae5", darkBg: "rgba(16, 185, 129, 0.2)" },
  { id: "Développement", icon: "bi-graph-up-arrow", color: "#f59e0b", bg: "#fef3c7", darkBg: "rgba(245, 158, 11, 0.2)" }
];

export default function Dashboard({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);

  // Mode sombre / clair
  const [darkMode, setDarkMode] = useState(false);

  // Navigation : "tableau", "documents", "corbeille", "parametres"
  const [activeTab, setActiveTab] = useState("tableau");

  // Sous-onglets Paramètres
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState("compte");

  // États des documents
  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Corbeille
  const [trashDocuments, setTrashDocuments] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);

  // Recherche dynamique
  const [searchQuery, setSearchQuery] = useState("");

  // Modales & États de téléchargement / prévisualisation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docToEdit, setDocToEdit] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingRef, setDownloadingRef] = useState(null);

  // Thèmes dynamique (Clair / Sombre)
  const theme = {
    bg: darkMode ? "#0f172a" : "#f8fafc",
    sidebarBg: darkMode ? "#1e293b" : "#ffffff",
    cardBg: darkMode ? "#1e293b" : "#ffffff",
    textPrimary: darkMode ? "#f8fafc" : "#0f172a",
    textSecondary: darkMode ? "#94a3b8" : "#64748b",
    border: darkMode ? "#334155" : "#e2e8f0",
    hoverBg: darkMode ? "#334155" : "#f1f5f9",
    inputBg: darkMode ? "#0f172a" : "#ffffff",
    accent: "#3b82f6"
  };

  const handleUpdateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || user?.im || user?.im_dag_rh || "";
    return {
      "Authorization": `Bearer ${token}`,
      "X-User-IM": token
    };
  };

  // GET /api/v1/documents/
  const fetchAllDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setAllDocuments(list);
      }
    } catch (error) {
      console.error("Erreur récupération globale :", error);
    }
  };

  // GET /api/v1/documents/ ou GET /api/v1/documents/search?cat=...
  const fetchDocuments = async (category = selectedCategory) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/`;
      if (category) {
        url = `${API_BASE_URL}/search?cat=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur de connexion à l'API :", error);
    } finally {
      setLoading(false);
    }
  };

  // GET /api/v1/documents/me
  const fetchMyDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/me`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur récupération mes documents :", error);
    } finally {
      setLoading(false);
    }
  };

  // GET /api/v1/documents/trash
  const fetchTrashDocuments = async () => {
    setTrashLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/trash`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setTrashDocuments(list);
      }
    } catch (error) {
      console.error("Erreur corbeille :", error);
    } finally {
      setTrashLoading(false);
    }
  };

  // GET /api/v1/documents/{num_ref}/download
  const handleDownload = async (doc) => {
    setDownloadingRef(doc.num_ref);
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/download`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const fileExtension = doc.format ? doc.format.toLowerCase() : "pdf";
        a.download = `${doc.num_ref}_${doc.title.replace(/\s+/g, "_")}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Impossible de télécharger le document.");
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
      alert("Une erreur est survenue lors du téléchargement.");
    } finally {
      setDownloadingRef(null);
    }
  };

  // POST /api/v1/documents/{num_ref}/restore
  const handleRestore = async (num_ref) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(num_ref)}/restore`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setTrashDocuments((prev) => prev.filter((doc) => doc.num_ref !== num_ref));
        await fetchAllDocuments();
        await fetchDocuments(selectedCategory);
      } else {
        alert("Erreur lors de la restauration du document.");
      }
    } catch (error) {
      console.error("Erreur restauration :", error);
    }
  };

  // DELETE /api/v1/documents/{num_ref}
  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(docToDelete.num_ref)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() }
      });

      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.num_ref !== docToDelete.num_ref));
        setAllDocuments((prev) => prev.filter((doc) => doc.num_ref !== docToDelete.num_ref));
        setDocToDelete(null);
      } else {
        alert("Erreur lors de la suppression du document.");
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // GET /api/v1/documents/{num_ref}/preview
  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${encodeURIComponent(doc.num_ref)}/preview`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blobData = await response.blob();
        const contentType = response.headers.get("Content-Type") || "application/pdf";
        const fileBlob = new Blob([blobData], { type: contentType });
        const objectUrl = URL.createObjectURL(fileBlob);
        setPreviewUrl(objectUrl);
      } else {
        alert("Erreur lors du chargement de la prévisualisation.");
        setPreviewDoc(null);
      }
    } catch (err) {
      console.error("Erreur prévisualisation :", err);
      alert("Erreur lors du chargement de la prévisualisation.");
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const getDaysRemaining = (deletedAtDate) => {
    if (!deletedAtDate) return 30;
    const deletedDate = new Date(deletedAtDate);
    const now = new Date();
    const diffTime = Math.abs(now - deletedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  // Filtrage local dynamique dans le tableau
  const searchedDocuments = allDocuments.filter((doc) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const fields = [doc.num_ref, doc.title, doc.cat, doc.annee_redac, doc.format];
    return fields.some((value) =>
      value !== null && value !== undefined && String(value).toLowerCase().includes(query)
    );
  });

  const displayedDocuments = searchQuery.trim() ? searchedDocuments : documents;

  useEffect(() => {
    fetchAllDocuments();
    fetchDocuments(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCategoryClick = (catId) => {
    const newCategory = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCategory);
    fetchDocuments(newCategory);
  };

  const getCategoryCount = (catId) => {
    return allDocuments.filter(
      (doc) => doc.cat && doc.cat.trim().toLowerCase() === catId.toLowerCase()
    ).length;
  };

  const renderPieChart = () => {
    const nominationCount = getCategoryCount("Nomination");
    const financeCount = getCategoryCount("Finance");
    const developpementCount = getCategoryCount("Développement");
    const total = nominationCount + financeCount + developpementCount;

    if (total === 0) {
      return <p style={{ fontSize: "12px", color: theme.textSecondary, textAlign: "center", margin: "auto" }}>Aucune donnée</p>;
    }

    const slices = [
      { percentage: (nominationCount / total) * 100, color: "#6366f1", label: "Nomination" },
      { percentage: (financeCount / total) * 100, color: "#10b981", label: "Finance" },
      { percentage: (developpementCount / total) * 100, color: "#f59e0b", label: "Développement" },
    ];

    let cumulativePercent = 0;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
        <svg viewBox="0 0 32 32" style={{ width: "90px", height: "90px", transform: "rotate(-90deg)", borderRadius: "50%" }}>
          {slices.map((slice, index) => {
            if (slice.percentage === 0) return null;
            const strokeDasharray = `${slice.percentage} ${100 - slice.percentage}`;
            const strokeDashoffset = -cumulativePercent;
            cumulativePercent += slice.percentage;

            return (
              <circle
                key={index}
                cx="16"
                cy="16"
                r="15.91549430918954"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="31.8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </svg>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {slices.map((slice, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: theme.textPrimary }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: slice.color }}></span>
              <strong>{slice.label} :</strong> {Math.round(slice.percentage)}%
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="layout-container" style={{ backgroundColor: theme.bg, color: theme.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", display: "flex", minHeight: "100vh", transition: "background-color 0.3s, color 0.3s" }}>
      
      {/* SIDEBAR */}
      <aside className="sidebar" style={{ backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.border}`, width: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.3s" }}>
        <div>
          <div className="brand-header" style={{ padding: "20px 18px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoGed} alt="Logo GED" style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <div>
              <h1 style={{ fontSize: "16px", fontWeight: "700", color: theme.textPrimary, margin: 0 }}>
                GED District
              </h1>
              <p style={{ fontSize: "12px", color: theme.textSecondary, margin: 0 }}>
                Haute Matsiatra
              </p>
            </div>
          </div>

          <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              onClick={() => { setActiveTab("tableau"); fetchDocuments(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "tableau" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                color: activeTab === "tableau" ? "#ffffff" : theme.textSecondary,
                fontWeight: activeTab === "tableau" ? "600" : "500",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-grid-1x2-fill"></i> Tableau de bord
            </button>

            <button
              onClick={() => { setActiveTab("documents"); fetchMyDocuments(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "documents" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                color: activeTab === "documents" ? "#ffffff" : theme.textSecondary,
                fontWeight: activeTab === "documents" ? "600" : "500",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-folder-fill"></i> Mes Documents
            </button>

            <button
              onClick={() => { setActiveTab("corbeille"); fetchTrashDocuments(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "corbeille" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                color: activeTab === "corbeille" ? "#ffffff" : theme.textSecondary,
                fontWeight: activeTab === "corbeille" ? "600" : "500",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-trash3-fill"></i> Corbeille
            </button>

            <div>
              <button
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setActiveTab("parametres");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: activeTab === "parametres" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                  color: activeTab === "parametres" ? "#ffffff" : theme.textSecondary,
                  fontWeight: activeTab === "parametres" ? "600" : "500",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <i className="bi bi-gear-fill"></i> Paramètres
                </span>
                <i className={`bi bi-chevron-${isSettingsOpen ? "up" : "down"}`} style={{ fontSize: "12px" }}></i>
              </button>

              {isSettingsOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px", paddingLeft: "28px" }}>
                  {[
                    { id: "compte", label: "Paramètres du compte", icon: "bi-person" },
                    { id: "password", label: "Mise à jour du compte", icon: "bi-shield-lock" }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setActiveTab("parametres");
                        setActiveSettingsSubTab(sub.id);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: activeTab === "parametres" && activeSettingsSubTab === sub.id ? theme.hoverBg : "transparent",
                        color: activeTab === "parametres" && activeSettingsSubTab === sub.id ? theme.textPrimary : theme.textSecondary,
                        fontWeight: activeSettingsSubTab === sub.id ? "600" : "500",
                        fontSize: "13px",
                        cursor: "pointer"
                      }}
                    >
                      <i className={`bi ${sub.icon}`}></i> {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                fontWeight: "600",
                cursor: "pointer",
                marginTop: "16px",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-plus-lg"></i> Nouveau Document
            </button>
          </nav>
        </div>

        <div style={{ padding: "16px", borderTop: `1px solid ${theme.border}`, fontSize: "12px", color: theme.textSecondary }}>
          <p style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }}></span>
            <span>Système En Ligne</span>
          </p>
          <span>Version v1.2.0</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TOPBAR */}
        <header style={{ backgroundColor: theme.sidebarBg, padding: "14px 28px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center", transition: "all 0.3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                backgroundColor: theme.bg,
                border: `1px solid ${theme.border}`,
                color: theme.textPrimary,
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "15px",
                transition: "all 0.2s"
              }}
              title={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
            >
              <i className={`bi ${darkMode ? "bi-sun-fill" : "bi-moon-stars-fill"}`}></i>
            </button>

            <div style={{ width: "1px", height: "24px", backgroundColor: theme.border }}></div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: darkMode ? "#334155" : "#e2e8f0", color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : "A"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ display: "block", color: theme.textPrimary, lineHeight: "1.2" }}>
                  {user?.prenom || "Agent"} {user?.nom || ""}
                </strong>
                <span style={{ color: theme.textSecondary, fontSize: "11px" }}>
                  {user?.type_user || "Gestionnaire DAG/RH"}
                </span>
              </div>
            </div>

            <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: theme.textSecondary }} title="Déconnexion">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        {/* MAIN BODY */}
        <main style={{ padding: "28px", flex: 1, overflowY: "auto" }}>
          
          {/* TAB 1: TABLEAU DE BORD */}
          {activeTab === "tableau" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme.textPrimary, margin: "0 0 4px 0" }}>
                    Bonjour {user?.prenom || "Administrateur"} !
                  </h2>
                  <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>
                    Plateforme de gestion et d'archivage des documents administratifs
                  </p>
                </div>
                <div style={{ backgroundColor: theme.cardBg, padding: "8px 14px", borderRadius: "8px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-calendar3"></i> 
                  {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              {/* STATISTIQUES CARTE TOTAL & REPARTITION */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                <div style={{ backgroundColor: theme.cardBg, padding: "20px", borderRadius: "12px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: theme.textSecondary }}>Total Documents Archivés</span>
                    <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                      <i className="bi bi-files"></i>
                    </div>
                  </div>
                  <h3 style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: theme.textPrimary }}>{allDocuments.length}</h3>
                  <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: theme.textSecondary }}>Documents répertoriés dans le système</p>
                </div>

                <div style={{ backgroundColor: theme.cardBg, padding: "18px 20px", borderRadius: "12px", border: `1px solid ${theme.border}`, boxShadow: "0 2px 5px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h4 style={{ margin: "0 0 14px 0", fontSize: "12px", fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Répartition par Pôle
                  </h4>
                  {renderPieChart()}
                </div>
              </div>

              {/* CATEGORIES SELECTIONNABLES */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
                {CATEGORIES.map((cat) => {
                  const count = getCategoryCount(cat.id);
                  const isSelected = selectedCategory === cat.id;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      style={{
                        cursor: "pointer",
                        backgroundColor: theme.cardBg,
                        padding: "16px",
                        borderRadius: "12px",
                        border: isSelected ? `2px solid ${cat.color}` : `1px solid ${theme.border}`,
                        boxShadow: "0 2px 5px rgba(0,0,0,0.03)",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ backgroundColor: darkMode ? cat.darkBg : cat.bg, color: cat.color, width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px", fontSize: "18px" }}>
                        <i className={`bi ${cat.icon}`}></i>
                      </div>
                      <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: theme.textPrimary }}>
                        {cat.id}
                      </h3>
                      <span style={{ fontSize: "12px", color: theme.textSecondary, fontWeight: "600" }}>
                        {count} {count > 1 ? "documents" : "document"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* BARRE DE RECHERCHE */}
              <div
                style={{
                  backgroundColor: theme.cardBg,
                  borderRadius: "12px",
                  border: `1px solid ${theme.border}`,
                  padding: "16px",
                  marginBottom: "24px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: theme.inputBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "10px",
                    padding: "5px 14px"
                  }}
                >
                  <i className="bi bi-search" style={{ color: theme.textSecondary, fontSize: "16px", marginRight: "10px" }}></i>

                  <input
                    type="text"
                    placeholder="Rechercher par référence, titre, catégorie, année, format..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontSize: "13px",
                      color: theme.textPrimary,
                      backgroundColor: "transparent",
                      padding: "9px 0"
                    }}
                  />

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      title="Effacer"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: theme.textSecondary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px"
                      }}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>

                {searchQuery.trim() && (
                  <div style={{ marginTop: "8px", fontSize: "12px", color: theme.accent, fontWeight: "600" }}>
                    {displayedDocuments.length} résultat{displayedDocuments.length > 1 ? "s" : ""} trouvé{displayedDocuments.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {/* TABLEAU DES DOCUMENTS */}
              <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: theme.textPrimary, margin: 0 }}>
                    {searchQuery.trim()
                      ? `Résultats de recherche (${displayedDocuments.length})`
                      : selectedCategory
                        ? `Filtre Catégorie : ${selectedCategory}`
                        : "Liste des Documents Administratifs"}
                  </h3>

                  <button onClick={() => { fetchAllDocuments(); fetchDocuments(selectedCategory); }} style={{ backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    <i className="bi bi-arrow-clockwise"></i> Actualiser
                  </button>
                </div>

                {loading ? (
                  <p style={{ color: theme.textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>Chargement des enregistrements...</p>
                ) : displayedDocuments.length === 0 ? (
                  <p style={{ color: theme.textSecondary, fontSize: "13px", padding: "20px 0", textAlign: "center" }}>
                    Aucun document ne correspond à vos critères.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                          <th style={{ padding: "12px 14px" }}>Référence</th>
                          <th style={{ padding: "12px 14px" }}>Titre du document</th>
                          <th style={{ padding: "12px 14px" }}>Catégorie</th>
                          <th style={{ padding: "12px 14px" }}>Année</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedDocuments.map((doc) => (
                          <tr key={doc.num_ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td style={{ padding: "12px 14px", fontWeight: "700", color: theme.textPrimary }}>{doc.num_ref}</td>
                            <td style={{ padding: "12px 14px", color: theme.textPrimary }}>{doc.title}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
                                {doc.cat}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", textTransform: "uppercase", fontWeight: "600", color: theme.textSecondary }}>
                              {doc.annee_redac || "PDF"}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button 
                                  onClick={() => handleDownload(doc)} 
                                  disabled={downloadingRef === doc.num_ref}
                                  style={{ backgroundColor: darkMode ? "rgba(16, 185, 129, 0.15)" : "#e6f4ea", border: "1px solid #a7f3d0", borderRadius: "6px", padding: "5px 9px", cursor: "pointer", color: "#10b981" }} 
                                  title="Télécharger"
                                >
                                  <i className={`bi ${downloadingRef === doc.num_ref ? "bi-hourglass-split" : "bi-download"}`}></i>
                                </button>
                                
                                <button onClick={() => handleOpenPreview(doc)} style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: theme.textPrimary }} title="Aperçu">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button onClick={() => setDocToEdit(doc)} style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: theme.textPrimary }} title="Modifier">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button onClick={() => setDocToDelete(doc)} style={{ backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#ef4444" }} title="Supprimer">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
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

          {/* TAB 2: MES DOCUMENTS */}
          {activeTab === "documents" && (
            <div>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", color: theme.textPrimary, margin: "0 0 4px 0" }}>
                  Mes Documents Importés
                </h2>
                <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>
                  Liste des documents que vous avez enregistrés dans le système
                </p>
              </div>

              <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}>
                {loading ? (
                  <p style={{ color: theme.textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>Chargement de vos documents...</p>
                ) : documents.length === 0 ? (
                  <p style={{ color: theme.textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>Vous n'avez encore créé aucun document.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                          <th style={{ padding: "12px 14px" }}>Référence</th>
                          <th style={{ padding: "12px 14px" }}>Titre</th>
                          <th style={{ padding: "12px 14px" }}>Catégorie</th>
                          <th style={{ padding: "12px 14px" }}>Année</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.num_ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td style={{ padding: "12px 14px", fontWeight: "700", color: theme.textPrimary }}>{doc.num_ref}</td>
                            <td style={{ padding: "12px 14px", color: theme.textPrimary }}>{doc.title}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
                                {doc.cat}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", color: theme.textSecondary, fontWeight: "600" }}>{doc.annee_redac || "-"}</td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: "6px" }}>
                                <button 
                                  onClick={() => handleDownload(doc)} 
                                  disabled={downloadingRef === doc.num_ref}
                                  style={{ backgroundColor: darkMode ? "rgba(16, 185, 129, 0.15)" : "#e6f4ea", border: "1px solid #a7f3d0", borderRadius: "6px", padding: "5px 9px", cursor: "pointer", color: "#10b981" }} 
                                  title="Télécharger"
                                >
                                  <i className={`bi ${downloadingRef === doc.num_ref ? "bi-hourglass-split" : "bi-download"}`}></i>
                                </button>

                                <button onClick={() => handleOpenPreview(doc)} style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: theme.textPrimary }} title="Aperçu">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button onClick={() => setDocToEdit(doc)} style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: theme.textPrimary }} title="Modifier">
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button onClick={() => setDocToDelete(doc)} style={{ backgroundColor: darkMode ? "rgba(239, 68, 68, 0.2)" : "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "5px 8px", cursor: "pointer", color: "#ef4444" }} title="Supprimer">
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>Anne
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CORBEILLE */}
          {activeTab === "corbeille" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "700", color: theme.textPrimary, margin: "0 0 4px 0" }}>
                    Corbeille
                  </h2>
                  <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>
                    Les documents supprimés restent disponibles pendant 30 jours avant leur suppression définitive.
                  </p>
                </div>
                <button
                  onClick={fetchTrashDocuments}
                  style={{ backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <i className="bi bi-arrow-clockwise"></i> Actualiser
                </button>
              </div>

              <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}>
                {trashLoading ? (
                  <p style={{ color: theme.textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>Vérification de la corbeille...</p>
                ) : trashDocuments.length === 0 ? (
                  <p style={{ color: theme.textSecondary, fontSize: "13px", textAlign: "center", padding: "20px" }}>Aucun document dans la corbeille.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                          <th style={{ padding: "12px 14px" }}>Référence</th>
                          <th style={{ padding: "12px 14px" }}>Titre</th>
                          <th style={{ padding: "12px 14px" }}>Catégorie</th>
                          <th style={{ padding: "12px 14px" }}>Jours restants</th>
                          <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trashDocuments.map((doc) => {
                          const daysLeft = getDaysRemaining(doc.deleted_at || doc.updated_at);
                          return (
                            <tr key={doc.num_ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                              <td style={{ padding: "12px 14px", fontWeight: "700", color: theme.textPrimary }}>{doc.num_ref}</td>
                              <td style={{ padding: "12px 14px", color: theme.textPrimary }}>{doc.title}</td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "600", backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
                                  {doc.cat}
                                </span>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: daysLeft <= 5 ? "#ef4444" : "#f59e0b", backgroundColor: darkMode ? "rgba(245, 158, 11, 0.1)" : "#fffbeb", padding: "4px 8px", borderRadius: "6px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <i className="bi bi-clock-history"></i> {daysLeft} jour{daysLeft > 1 ? "s" : ""}
                                </span>
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                <button
                                  onClick={() => handleRestore(doc.num_ref)}
                                  style={{ backgroundColor: darkMode ? "rgba(16, 185, 129, 0.2)" : "#f0fdf4", border: "1px solid #10b981", color: "#10b981", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                  <i className="bi bi-arrow-counterclockwise"></i> Restaurer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PARAMÈTRES */}
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

      {/* MODALE DE PRÉVISUALISATION */}
      {previewDoc && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", width: "90%", height: "85%", maxWidth: "900px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "16px", backgroundColor: theme.sidebarBg, color: theme.textPrimary, borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700" }}>
                Aperçu : {previewDoc.title} ({previewDoc.num_ref})
              </h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => handleDownload(previewDoc)} 
                  style={{ backgroundColor: "#10b981", color: "#ffffff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <i className="bi bi-download"></i> Télécharger
                </button>
                <button onClick={handleClosePreview} style={{ background: "none", border: "none", color: theme.textPrimary, cursor: "pointer", fontSize: "18px" }}>
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: theme.bg, display: "flex", justifyContent: "center", alignItems: "center" }}>
              {previewLoading ? (
                <p style={{ color: theme.textPrimary, fontWeight: "600" }}>Chargement du document...</p>
              ) : previewUrl ? (
                <iframe src={previewUrl} title="Aperçu Document" style={{ width: "100%", height: "100%", border: "none" }} />
              ) : (
                <p style={{ color: "#ef4444" }}>Impossible d'afficher le document.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE SUPPRESSION (SOFT-DELETE) */}
      {docToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1050 }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", padding: "24px", maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 12px 0", color: "#ef4444", fontSize: "16px" }}>Mettre en corbeille</h3>
            <p style={{ fontSize: "13px", color: theme.textPrimary, marginBottom: "20px" }}>
              Voulez-vous déplacer le document <strong>{docToDelete.title}</strong> vers la corbeille ?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setDocToDelete(null)} style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} style={{ backgroundColor: "#ef4444", border: "none", color: "#ffffff", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>
                {isDeleting ? "Déplacement..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES UPLOAD & EDIT */}
      {isModalOpen && (
        <DocumentUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={async () => {
            setIsModalOpen(false);
            await fetchAllDocuments();
            await fetchDocuments(selectedCategory);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {docToEdit && (
        <DocumentEditModal
          doc={docToEdit}
          onClose={() => setDocToEdit(null)}
          onSuccess={async () => {
            setDocToEdit(null);
            await fetchAllDocuments();
            await fetchDocuments(selectedCategory);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}
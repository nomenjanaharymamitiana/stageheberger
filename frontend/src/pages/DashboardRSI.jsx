import React, { useState, useEffect } from "react";
import logoGed from "../assets/WhatsApp Image 2026-09-21 at 11.01.52.jpeg";
import "../styles/theme.css";
import Parametres from "./Parametres";
import translations from "../locales/translations.json";

// Endpoints FastAPI
const API_DOCUMENTS = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/documents`;
const API_JOURNAL = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/journal`;
const API_USERS = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/users`;
const API_PASSWORD_REQUESTS = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/demandes-mdp`;

const CATEGORIES = [
  { id: "Nomination", icon: "bi-person-badge-fill", color: "#6366f1", bg: "#e0e7ff", darkBg: "rgba(99, 102, 241, 0.2)" },
  { id: "Finance", icon: "bi-cash-coin", color: "#10b981", bg: "#d1fae5", darkBg: "rgba(16, 185, 129, 0.2)" },
  { id: "Développement", icon: "bi-code-slash", color: "#f59e0b", bg: "#fef3c7", darkBg: "rgba(245, 158, 11, 0.2)" }
];

export default function DashboardRSI({ user: initialUser, onLogout }) {
  const [user, setUser] = useState(initialUser);
  const [lang, setLang] = useState("fr");
  const t = translations[lang] || translations["fr"] || {};

  // Mode sombre (Dark Mode)
  const [darkMode, setDarkMode] = useState(false);

  // Navigation RSI : "tableau", "documents", "utilisateurs", "demandes_mdp", "corbeille", "journal", "parametres"
  const [activeTab, setActiveTab] = useState("tableau");
  
  // Sidebar et Sous-onglets Paramètres
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState("compte");

  // State Notifications Topbar
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // State Demandes de Réinitialisation de Mot de Passe
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Données Documents, Corbeille & Graphique
  const [documents, setDocuments] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [trashDocuments, setTrashDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Données Utilisateurs (DAG / RH)
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [userSearchText, setUserSearchText] = useState("");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    im: "",
    nom: "",
    prenom: "",
    password: "",
    role: "DAG"
  });

  // Données du Journal
  const [journals, setJournals] = useState([]);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalFilters, setJournalFilters] = useState({
    date_action: "",
    im_user: "",
    num_ref_doc: ""
  });

  // Filtres de recherche documents
  const [searchFilters, setSearchFilters] = useState({
    num_ref: "",
    cat: "",
    annee_redac: "",
    file_format: "",
    title: ""
  });

  // Modale Prévisualisation Document
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Thème dynamique
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
    const token = localStorage.getItem("token") || user?.im || "";
    return {
      "Authorization": `Bearer ${token}`,
      "X-User-IM": token,
      "Content-Type": "application/json"
    };
  };

  // Synchronisation des notifications (Mots de passe uniquement)
  const updateCombinedNotifications = (passRequestsList = []) => {
    const passNotifs = passRequestsList
      .filter((r) => r.statut === "en_attente" || r.status === "en_attente")
      .map((req) => ({
        id: `pwd-${req.id_dmd || req.id || req.im_user}`,
        type: "PASSWORD_REQ",
        title: "Demande de mot de passe",
        message: `L'agent ${req.im_user} (${req.nom || ''} ${req.prenom || ''}) demande une réinitialisation.`,
        date: req.date_demande || "Récemment",
        read: false,
        targetTab: "demandes_mdp"
      }));

    setNotifications(passNotifs);
  };

  // ---------------- API DEMANDES MOT DE PASSE ----------------
  const fetchPasswordRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await fetch(`${API_PASSWORD_REQUESTS}/pending`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setPasswordRequests(list);
        updateCombinedNotifications(list);
      }
    } catch (error) {
      console.error("Erreur récuperation des demandes de mot de passe :", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    if (!window.confirm("Approuver cette demande et réinitialiser le mot de passe de l'agent ?")) return;
    try {
      const response = await fetch(`${API_PASSWORD_REQUESTS}/${encodeURIComponent(requestId)}/valider`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert("Demande validée avec succès.");
        fetchPasswordRequests();
      } else {
        alert("Erreur lors de l'approbation de la demande.");
      }
    } catch (error) {
      console.error("Erreur approbation demande :", error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!window.confirm("Refuser cette demande de réinitialisation ?")) return;
    try {
      const response = await fetch(`${API_PASSWORD_REQUESTS}/${encodeURIComponent(requestId)}/rejeter`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert("Demande rejetée avec succès.");
        fetchPasswordRequests();
      } else {
        alert("Erreur lors du rejet de la demande.");
      }
    } catch (error) {
      console.error("Erreur rejet demande :", error);
    }
  };

  // ---------------- API DOCUMENTS & CORBEILLE ----------------
  const fetchAllDocuments = async () => {
    try {
      const response = await fetch(`${API_DOCUMENTS}/`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setAllDocuments(list);
      }
    } catch (error) {
      console.error("Erreur récupération globale :", error);
    }
  };

  const fetchDocuments = async (category = selectedCategory) => {
    setLoading(true);
    try {
      let url = `${API_DOCUMENTS}/`;
      if (category) {
        url = `${API_DOCUMENTS}/search?cat=${encodeURIComponent(category)}`;
      }

      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur connexion API documents :", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_DOCUMENTS}/trash`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setTrashDocuments(list);
      }
    } catch (error) {
      console.error("Erreur chargement corbeille :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDoc = async (num_ref) => {
    try {
      const response = await fetch(`${API_DOCUMENTS}/${encodeURIComponent(num_ref)}/restore`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert(`Le document ${num_ref} a été restauré avec succès.`);
        fetchTrashDocuments();
        fetchAllDocuments();
        fetchDocuments(selectedCategory);
      } else {
        alert("Erreur lors de la restauration.");
      }
    } catch (error) {
      console.error("Erreur restauration :", error);
    }
  };

  const handleHardDeleteDoc = async (num_ref) => {
    if (!window.confirm(`Voulez-vous supprimer DÉFINITIVEMENT le document ${num_ref} ?`)) return;
    try {
      const response = await fetch(`${API_DOCUMENTS}/${encodeURIComponent(num_ref)}/hard`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchTrashDocuments();
      } else {
        alert("Erreur lors de la suppression définitive.");
      }
    } catch (error) {
      console.error("Erreur suppression définitive :", error);
    }
  };

  const handleSoftDeleteDoc = async (num_ref) => {
    if (!window.confirm(`Déplacer le document ${num_ref} vers la corbeille ?`)) return;
    try {
      const response = await fetch(`${API_DOCUMENTS}/${encodeURIComponent(num_ref)}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        fetchAllDocuments();
        fetchDocuments(selectedCategory);
      }
    } catch (error) {
      console.error("Erreur mise en corbeille :", error);
    }
  };

  const handleExecuteSearch = async (overrideFilters = null) => {
    setLoading(true);
    try {
      const activeFilters = overrideFilters || searchFilters;
      const queryParams = new URLSearchParams();

      if (activeFilters.title?.trim()) queryParams.append("title", activeFilters.title.trim());
      if (activeFilters.num_ref?.trim()) queryParams.append("num_ref", activeFilters.num_ref.trim());
      if (activeFilters.cat?.trim()) queryParams.append("cat", activeFilters.cat.trim());
      if (activeFilters.annee_redac?.trim()) queryParams.append("annee_redac", activeFilters.annee_redac.trim());
      if (activeFilters.file_format?.trim()) queryParams.append("file_format", activeFilters.file_format.trim());

      const url = `${API_DOCUMENTS}/search?${queryParams.toString()}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.documents || [];
        setDocuments(list);
      }
    } catch (error) {
      console.error("Erreur recherche documents :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSearch = () => {
    const resetState = { num_ref: "", cat: "", annee_redac: "", file_format: "", title: "" };
    setSearchFilters(resetState);
    fetchDocuments(selectedCategory);
  };

  // ---------------- API GESTION DES UTILISATEURS (DAG / RH) ----------------
  const fetchUsers = async (roleFilter = selectedRoleFilter) => {
    setUsersLoading(true);
    try {
      let url = `${API_USERS}/`;
      if (roleFilter) {
        url += `?role=${encodeURIComponent(roleFilter)}`;
      }
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setUsersList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs :", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updatePayload = {
          nom: userFormData.nom,
          prenom: userFormData.prenom,
          role: userFormData.role
        };
        const response = await fetch(`${API_USERS}/${encodeURIComponent(editingUser.im)}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
          alert("Utilisateur mis à jour avec succès !");
          setShowUserModal(false);
          fetchUsers();
        } else {
          const errData = await response.json();
          alert(`Erreur : ${errData.detail || "Échec de la mise à jour."}`);
        }
      } else {
        const response = await fetch(`${API_USERS}/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(userFormData)
        });

        if (response.ok) {
          alert("Nouvel utilisateur créé avec succès !");
          setShowUserModal(false);
          fetchUsers();
        } else {
          const errData = await response.json();
          alert(`Erreur : ${errData.detail || "Échec de la création."}`);
        }
      }
    } catch (error) {
      console.error("Erreur sauvegarde utilisateur :", error);
    }
  };

  const handleDeleteUser = async (im) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'utilisateur matricule ${im} ?`)) return;
    try {
      const response = await fetch(`${API_USERS}/${encodeURIComponent(im)}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (response.ok) {
        alert(`Utilisateur ${im} supprimé.`);
        fetchUsers();
      } else {
        const errData = await response.json();
        alert(`Erreur : ${errData.detail || "Impossible de supprimer l'utilisateur."}`);
      }
    } catch (error) {
      console.error("Erreur suppression utilisateur :", error);
    }
  };

  const handleOpenUserModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserFormData({
        im: userToEdit.im,
        nom: userToEdit.nom || "",
        prenom: userToEdit.prenom || "",
        password: "",
        role: userToEdit.role || userToEdit.type_user || "DAG"
      });
    } else {
      setEditingUser(null);
      setUserFormData({
        im: "",
        nom: "",
        prenom: "",
        password: "",
        role: "DAG"
      });
    }
    setShowUserModal(true);
  };

  // ---------------- API JOURNAL ----------------
  const fetchJournal = async () => {
    setJournalLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (journalFilters.date_action) queryParams.append("date_action", journalFilters.date_action);
      if (journalFilters.im_user?.trim()) queryParams.append("im_user", journalFilters.im_user.trim());
      if (journalFilters.num_ref_doc?.trim()) queryParams.append("num_ref_doc", journalFilters.num_ref_doc.trim());

      const response = await fetch(`${API_JOURNAL}/?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setJournals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur chargement journal :", error);
    } finally {
      setJournalLoading(false);
    }
  };

  const handleResetJournalFilters = () => {
    setJournalFilters({ date_action: "", im_user: "", num_ref_doc: "" });
    fetchJournal();
  };

  useEffect(() => {
    fetchAllDocuments();
    fetchDocuments(null);
    fetchPasswordRequests();

    // Vérification automatique des nouvelles demandes toutes les 10 secondes
    const passwordRequestInterval = setInterval(() => {
      fetchPasswordRequests();
    }, 10000);

    return () => clearInterval(passwordRequestInterval);
  }, []);

  useEffect(() => {
    if (activeTab === "journal") {
      fetchJournal();
    } else if (activeTab === "corbeille") {
      fetchTrashDocuments();
    } else if (activeTab === "utilisateurs") {
      fetchUsers();
    } else if (activeTab === "demandes_mdp") {
      fetchPasswordRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Aperçu des documents
  const handleOpenPreview = async (doc) => {
    setPreviewDoc(doc);
    setPreviewLoading(true);

    try {
      const response = await fetch(`${API_DOCUMENTS}/${encodeURIComponent(doc.num_ref)}/preview`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const blobData = await response.blob();
        const contentType = response.headers.get("Content-Type") || "application/pdf";
        const fileBlob = new Blob([blobData], { type: contentType });
        const objectUrl = URL.createObjectURL(fileBlob);
        setPreviewUrl(objectUrl);
      } else {
        alert("Erreur lors du chargement de l'aperçu.");
        setPreviewDoc(null);
      }
    } catch (err) {
      console.error("Erreur aperçu :", err);
      alert("Erreur lors du chargement.");
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

  // Graphique Camembert avec recalcul dynamique
  const renderPieChart = () => {
    const nominationCount = getCategoryCount("Nomination");
    const financeCount = getCategoryCount("Finance");
    const devCount = getCategoryCount("Développement");
    const total = nominationCount + financeCount + devCount;

    if (total === 0) {
      return <p style={{ fontSize: "12px", color: theme.textSecondary, textAlign: "center", margin: "auto" }}>Aucune donnée active</p>;
    }

    const slices = [
      { percentage: (nominationCount / total) * 100, color: "#6366f1", label: "Nomination" },
      { percentage: (financeCount / total) * 100, color: "#10b981", label: "Finance" },
      { percentage: (devCount / total) * 100, color: "#f59e0b", label: "Développement" },
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

  const filteredUsers = usersList.filter((u) => {
    const query = userSearchText.toLowerCase();
    return (
      u.im?.toLowerCase().includes(query) ||
      u.nom?.toLowerCase().includes(query) ||
      u.prenom?.toLowerCase().includes(query)
    );
  });

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  return (
    <div className="layout-container" style={{ backgroundColor: theme.bg, color: theme.textPrimary, fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", display: "flex", minHeight: "100vh", transition: "background-color 0.3s, color 0.3s" }}>
      
      {/* SIDEBAR */}
      <aside className="sidebar" style={{ backgroundColor: theme.sidebarBg, borderRight: `1px solid ${theme.border}`, width: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "all 0.3s" }}>
        <div>
          <div className="brand-header" style={{ padding: "20px 18px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoGed} alt="Logo GED" style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <div>
              <h1 style={{ fontSize: "16px", fontWeight: "700", color: theme.textPrimary, margin: 0 }}>
                {t.brand?.title || "GED District"}
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
              <i className="bi bi-grid-1x2-fill"></i> {t.nav?.dashboard || "Tableau de bord"}
            </button>

            <button
              onClick={() => { setActiveTab("documents"); fetchDocuments(null); }}
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
              <i className="bi bi-folder-fill"></i> Tous les Documents
            </button>

            {/* ONGLET GESTION UTILISATEURS (DAG / RH) */}
            <button
              onClick={() => { setActiveTab("utilisateurs"); fetchUsers(); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "utilisateurs" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                color: activeTab === "utilisateurs" ? "#ffffff" : theme.textSecondary,
                fontWeight: activeTab === "utilisateurs" ? "600" : "500",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-people-fill"></i> Utilisateurs (DAG / RH)
            </button>

            {/* ONGLET DEMANDES DE MOT DE PASSE */}
            <button
              onClick={() => { setActiveTab("demandes_mdp"); fetchPasswordRequests(); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "demandes_mdp" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                color: activeTab === "demandes_mdp" ? "#ffffff" : theme.textSecondary,
                fontWeight: activeTab === "demandes_mdp" ? "600" : "500",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <i className="bi bi-key-fill"></i> Demandes Mot de passe
              </span>
              {passwordRequests.filter(r => r.statut === "en_attente" || r.status === "en_attente").length > 0 && (
                <span style={{ backgroundColor: "#ef4444", color: "#fff", fontSize: "11px", borderRadius: "10px", padding: "2px 7px", fontWeight: "700" }}>
                  {passwordRequests.filter(r => r.statut === "en_attente" || r.status === "en_attente").length}
                </span>
              )}
            </button>

            {/* ONGLET CORBEILLE */}
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
              <i className="bi bi-trash-fill"></i> Corbeille
            </button>

            {/* ONGLET JOURNAL D'ACTIVITÉ */}
            <button
              onClick={() => { setActiveTab("journal"); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "11px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeTab === "journal" ? (darkMode ? "#3b82f6" : "#0f172a") : "transparent",
                color: activeTab === "journal" ? "#ffffff" : theme.textSecondary,
                fontWeight: activeTab === "journal" ? "600" : "500",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              <i className="bi bi-journal-text"></i> Journal d'Activité
            </button>

            {/* PARAMÈTRES */}
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
                  <i className="bi bi-gear-fill"></i> {t.nav?.settings || "Paramètres"}
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
          </nav>
        </div>

        <div style={{ padding: "16px", borderTop: `1px solid ${theme.border}`, fontSize: "12px", color: theme.textSecondary }}>
          <p style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e" }}></span>
            <span>Système RSI actif</span>
          </p>
          <span>v1.0.0</span>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* TOPBAR */}
        <header style={{ backgroundColor: theme.sidebarBg, padding: "14px 28px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "flex-end", alignItems: "center", transition: "all 0.3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            
            {/* BOUTON DE NOTIFICATION AVEC CLOCHETTE EN HAUT */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
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
                  fontSize: "16px",
                  position: "relative"
                }}
                title="Notifications"
              >
                <i className="bi bi-bell-fill"></i>
                {unreadNotifCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "10px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* MENU DÉROULANT DES NOTIFICATIONS DE LA BARRE SUPÉRIEURE */}
              {showNotificationsMenu && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "45px",
                  width: "340px",
                  backgroundColor: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "10px",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  zIndex: 200,
                  overflow: "hidden"
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "14px", color: theme.textPrimary }}>Notifications</strong>
                    <span style={{ fontSize: "11px", color: theme.textSecondary }}>{unreadNotifCount} nouvelle(s)</span>
                  </div>

                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <p style={{ padding: "16px", fontSize: "12px", color: theme.textSecondary, textAlign: "center", margin: 0 }}>
                        Aucune notification pour le moment.
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setActiveTab(notif.targetTab || "demandes_mdp");
                            setShowNotificationsMenu(false);
                          }}
                          style={{
                            padding: "12px 16px",
                            borderBottom: `1px solid ${theme.border}`,
                            backgroundColor: notif.read ? "transparent" : (darkMode ? "rgba(59, 130, 246, 0.1)" : "#f0f9ff"),
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <i className="bi bi-key-fill" style={{ color: "#f59e0b", fontSize: "14px" }}></i>
                            <strong style={{ fontSize: "13px", color: theme.textPrimary }}>{notif.title}</strong>
                          </div>
                          <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: theme.textSecondary }}>{notif.message}</p>
                          <span style={{ fontSize: "10px", color: theme.textSecondary }}>{notif.date}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        setActiveTab("demandes_mdp");
                        setShowNotificationsMenu(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: theme.hoverBg,
                        border: "none",
                        borderTop: `1px solid ${theme.border}`,
                        color: "#3b82f6",
                        fontSize: "12px",
                        fontWeight: "600",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      Voir les demandes de mot de passe
                    </button>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", backgroundColor: theme.bg, borderRadius: "20px", padding: "3px", border: `1px solid ${theme.border}` }}>
              {["fr", "mg"].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    background: lang === l ? theme.sidebarBg : "transparent",
                    color: lang === l ? theme.textPrimary : theme.textSecondary,
                    border: "none",
                    borderRadius: "16px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    fontWeight: "700",
                    fontSize: "12px",
                    boxShadow: lang === l ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                  }}
                >
                  {l === "fr" ? "FR" : "MG"}
                </button>
              ))}
            </div>

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
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#6366f1", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : "R"}
              </div>
              <div style={{ fontSize: "13px" }}>
                <strong style={{ display: "block", color: theme.textPrimary, lineHeight: "1.2" }}>
                  {user?.prenom || "Responsable"} {user?.nom || "RSI"}
                </strong>
                <span style={{ color: "#6366f1", fontWeight: "600", fontSize: "11px" }}>
                  Superviseur (RSI)
                </span>
              </div>
            </div>

            <button onClick={onLogout} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: theme.textSecondary }} title="Déconnexion">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </header>

        {/* BODY */}
        <main style={{ padding: "28px", flex: 1, overflowY: "auto" }}>
          
          {/* TAB 1 : TABLEAU DE BORD RSI */}
          {activeTab === "tableau" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "22px", fontWeight: "700", color: theme.textPrimary, margin: "0 0 4px 0" }}>
                    Bonjour {user?.prenom || "Responsable RSI"} !
                  </h2>
                  <p style={{ fontSize: "13px", color: theme.textSecondary, margin: 0 }}>
                    Supervision globale du système documentaire et des utilisateurs
                  </p>
                </div>
                <div style={{ backgroundColor: theme.cardBg, padding: "8px 14px", borderRadius: "8px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textSecondary, display: "flex", alignItems: "center", gap: "8px" }}>
                  <i className="bi bi-calendar3"></i> 
                  {new Date().toLocaleDateString(lang === "mg" ? "mg-MG" : "fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              {/* STATISTIQUES + CAMEMBERT */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
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
                          {count} {count > 1 ? "docs" : "doc"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ backgroundColor: theme.cardBg, padding: "18px 20px", borderRadius: "12px", border: `1px solid ${theme.border}`, boxShadow: "0 2px 5px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <h4 style={{ margin: "0 0 14px 0", fontSize: "12px", fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Répartition des documents
                  </h4>
                  {renderPieChart()}
                </div>
              </div>

              {/* BARRE DE RECHERCHE */}
              <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "16px", marginBottom: "24px", boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "240px", display: "flex", alignItems: "center", backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "4px 12px" }}>
                    <i className="bi bi-search" style={{ color: theme.textSecondary, fontSize: "15px", marginRight: "10px" }}></i>
                    <input
                      type="text"
                      placeholder="Rechercher un document..."
                      value={searchFilters.title}
                      onChange={(e) => setSearchFilters({ ...searchFilters, title: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && handleExecuteSearch()}
                      style={{ width: "100%", border: "none", outline: "none", fontSize: "13px", color: theme.textPrimary, backgroundColor: "transparent", padding: "8px 0" }}
                    />
                    {searchFilters.title && (
                      <button onClick={handleResetSearch} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textSecondary }}>
                        <i className="bi bi-x-lg"></i>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleExecuteSearch()}
                    style={{ backgroundColor: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Rechercher
                  </button>
                </div>
              </div>

              {/* TABLEAU DES DOCUMENTS */}
              <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px", boxShadow: "0 2px 5px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: theme.textPrimary }}>Liste Globale des Documents</h3>
                
                {loading ? (
                  <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Chargement des documents...</p>
                ) : documents.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Aucun document trouvé.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                        <th style={{ padding: "12px" }}>Référence</th>
                        <th style={{ padding: "12px" }}>Titre</th>
                        <th style={{ padding: "12px" }}>Catégorie</th>
                        <th style={{ padding: "12px" }}>Format</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.num_ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: "12px", fontWeight: "600" }}>{doc.num_ref}</td>
                          <td style={{ padding: "12px" }}>{doc.title}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ padding: "4px 8px", borderRadius: "6px", backgroundColor: theme.hoverBg, fontSize: "12px" }}>
                              {doc.cat}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textTransform: "uppercase" }}>{doc.format}</td>
                          <td style={{ padding: "12px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleOpenPreview(doc)}
                              style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                              title="Aperçu du document"
                            >
                              <i className="bi bi-eye-fill"></i>
                            </button>
                            <button
                              onClick={() => handleSoftDeleteDoc(doc.num_ref)}
                              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                              title="Déplacer vers la corbeille"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* TAB 2 : TOUS LES DOCUMENTS */}
          {activeTab === "documents" && (
            <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: theme.textPrimary }}>Index Complet des Documents Système</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                    <th style={{ padding: "12px" }}>Référence</th>
                    <th style={{ padding: "12px" }}>Titre</th>
                    <th style={{ padding: "12px" }}>Catégorie</th>
                    <th style={{ padding: "12px" }}>Date</th>
                    <th style={{ padding: "12px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allDocuments.map((doc) => (
                    <tr key={doc.num_ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: "12px", fontWeight: "600" }}>{doc.num_ref}</td>
                      <td style={{ padding: "12px" }}>{doc.title}</td>
                      <td style={{ padding: "12px" }}>{doc.cat}</td>
                      <td style={{ padding: "12px" }}>{doc.date_num}</td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenPreview(doc)}
                          style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                        >
                          <i className="bi bi-eye"></i> Aperçu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3 : GESTION DES UTILISATEURS (DAG / RH) */}
          {activeTab === "utilisateurs" && (
            <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: theme.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className="bi bi-people-fill" style={{ color: "#3b82f6" }}></i>
                    Gestion des Utilisateurs (Services DAG / RH)
                  </h3>
                  <p style={{ fontSize: "12px", color: theme.textSecondary, margin: "4px 0 0 0" }}>
                    Consultez, créez, modifiez ou supprimez les comptes des agents des services administratifs et RH.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenUserModal(null)}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <i className="bi bi-person-plus-fill"></i> Nouvel Agent
                </button>
              </div>

              {/* FILTRES D'UTILISATEURS */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px", display: "flex", alignItems: "center", backgroundColor: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "4px 12px" }}>
                  <i className="bi bi-search" style={{ color: theme.textSecondary, fontSize: "14px", marginRight: "8px" }}></i>
                  <input
                    type="text"
                    placeholder="Filtrer par IM, Nom, Prénom..."
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "13px", color: theme.textPrimary, backgroundColor: "transparent", padding: "8px 0" }}
                  />
                </div>

                <select
                  value={selectedRoleFilter}
                  onChange={(e) => {
                    const r = e.target.value;
                    setSelectedRoleFilter(r);
                    fetchUsers(r);
                  }}
                  style={{ backgroundColor: theme.inputBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "8px 14px", fontSize: "13px", outline: "none", cursor: "pointer" }}
                >
                  <option value="">Tous les Rôles (DAG / RH / RSI)</option>
                  <option value="DAG">Service DAG</option>
                  <option value="RH">Service RH</option>
                  <option value="RSI">Service RSI</option>
                </select>
              </div>

              {/* TABLEAU DES UTILISATEURS */}
              {usersLoading ? (
                <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Chargement des utilisateurs...</p>
              ) : filteredUsers.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Aucun utilisateur trouvé.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "12px" }}>IM (Matricule)</th>
                      <th style={{ padding: "12px" }}>Nom & Prénom</th>
                      <th style={{ padding: "12px" }}>Rôle / Service</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const userRole = u.role || u.type_user || "N/A";
                      const roleBg = userRole === "DAG" ? "rgba(59, 130, 246, 0.15)" : userRole === "RH" ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.15)";
                      const roleColor = userRole === "DAG" ? "#3b82f6" : userRole === "RH" ? "#10b981" : "#6366f1";

                      return (
                        <tr key={u.im} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: "12px", fontWeight: "700" }}>{u.im}</td>
                          <td style={{ padding: "12px", fontWeight: "500" }}>{u.nom} {u.prenom}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ padding: "4px 10px", borderRadius: "12px", backgroundColor: roleBg, color: roleColor, fontWeight: "700", fontSize: "11px" }}>
                              {userRole}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleOpenUserModal(u)}
                              style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                              title="Modifier les infos de l'agent"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.im)}
                              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#ef4444", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                              title="Supprimer l'agent"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB : DEMANDES DE MOT DE PASSE */}
          {activeTab === "demandes_mdp" && (
            <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: theme.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className="bi bi-key-fill" style={{ color: "#f59e0b" }}></i>
                    Demandes de Réinitialisation de Mot de Passe
                  </h3>
                  <p style={{ fontSize: "12px", color: theme.textSecondary, margin: "4px 0 0 0" }}>
                    Validez ou refusez les demandes de réinitialisation émises par les agents.
                  </p>
                </div>
                <button
                  onClick={fetchPasswordRequests}
                  style={{ backgroundColor: theme.hoverBg, border: `1px solid ${theme.border}`, color: theme.textPrimary, padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                >
                  <i className="bi bi-arrow-clockwise"></i> Actualiser
                </button>
              </div>

              {requestsLoading ? (
                <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Chargement des demandes...</p>
              ) : passwordRequests.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Aucune demande de réinitialisation trouvée.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "12px" }}>Agent (IM)</th>
                      <th style={{ padding: "12px" }}>Nom & Prénom</th>
                      <th style={{ padding: "12px" }}>Date de demande</th>
                      <th style={{ padding: "12px" }}>Statut</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {passwordRequests.map((req) => {
                      const reqId = req.id_dmd || req.id || req.im_user;
                      const status = req.statut || req.status || "en_attente";
                      
                      return (
                        <tr key={reqId} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: "12px", fontWeight: "700" }}>{req.im_user}</td>
                          <td style={{ padding: "12px" }}>{req.nom || "—"} {req.prenom || ""}</td>
                          <td style={{ padding: "12px" }}>{req.date_demande || "Non précisée"}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontWeight: "700",
                              fontSize: "11px",
                              backgroundColor: status === "en_attente" ? "rgba(245, 158, 11, 0.15)" : status === "validee" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: status === "en_attente" ? "#f59e0b" : status === "validee" ? "#10b981" : "#ef4444"
                            }}>
                              {status === "en_attente" ? "En attente" : status === "validee" ? "Validée" : "Rejetée"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                            {status === "en_attente" ? (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(reqId)}
                                  style={{ backgroundColor: "#10b981", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}
                                >
                                  <i className="bi bi-check-lg"></i> Approuver
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(reqId)}
                                  style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}
                                >
                                  <i className="bi bi-x-lg"></i> Refuser
                                </button>
                              </>
                            ) : (
                              <span style={{ fontSize: "12px", color: theme.textSecondary }}>Traitée</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 4 : CORBEILLE */}
          {activeTab === "corbeille" && (
            <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: theme.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                    <i className="bi bi-trash-fill" style={{ color: "#ef4444" }}></i>
                    Corbeille des Documents Supprimés
                  </h3>
                  <p style={{ fontSize: "12px", color: theme.textSecondary, margin: "4px 0 0 0" }}>
                    Régénérez (restaurez) les documents dans la base ou supprimez-les définitivement.
                  </p>
                </div>
              </div>

              {loading ? (
                <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Chargement de la corbeille...</p>
              ) : trashDocuments.length === 0 ? (
                <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>La corbeille est vide.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                      <th style={{ padding: "12px" }}>Référence</th>
                      <th style={{ padding: "12px" }}>Titre</th>
                      <th style={{ padding: "12px" }}>Catégorie</th>
                      <th style={{ padding: "12px" }}>Format</th>
                      <th style={{ padding: "12px", textAlign: "right" }}>Actions de Gestion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashDocuments.map((doc) => (
                      <tr key={doc.num_ref} style={{ borderBottom: `1px solid ${theme.border}` }}>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{doc.num_ref}</td>
                        <td style={{ padding: "12px" }}>{doc.title}</td>
                        <td style={{ padding: "12px" }}>{doc.cat}</td>
                        <td style={{ padding: "12px", textTransform: "uppercase" }}>{doc.format}</td>
                        <td style={{ padding: "12px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => handleRestoreDoc(doc.num_ref)}
                            style={{ backgroundColor: "#10b981", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}
                          >
                            <i className="bi bi-arrow-counterclockwise"></i> Régénérer
                          </button>
                          <button
                            onClick={() => handleHardDeleteDoc(doc.num_ref)}
                            style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "12px" }}
                          >
                            <i className="bi bi-x-circle"></i> Supprimer Définitif
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 5 : JOURNAL D'ACTIVITÉ */}
          {activeTab === "journal" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", border: `1px solid ${theme.border}`, padding: "20px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: theme.textPrimary, display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="bi bi-journal-text" style={{ color: "#6366f1" }}></i>
                  Journal des Actions & Événements Système
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Date d'action</label>
                    <input
                      type="date"
                      value={journalFilters.date_action}
                      onChange={(e) => setJournalFilters({ ...journalFilters, date_action: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Matricule Agent (IM)</label>
                    <input
                      type="text"
                      placeholder="Ex: DAG001"
                      value={journalFilters.im_user}
                      onChange={(e) => setJournalFilters({ ...journalFilters, im_user: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Réf. Document</label>
                    <input
                      type="text"
                      placeholder="Ex: 4511"
                      value={journalFilters.num_ref_doc}
                      onChange={(e) => setJournalFilters({ ...journalFilters, num_ref_doc: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                    <button
                      onClick={fetchJournal}
                      style={{ flex: 1, backgroundColor: "#6366f1", color: "#ffffff", border: "none", borderRadius: "6px", padding: "9px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Filtrer
                    </button>
                    <button
                      onClick={handleResetJournalFilters}
                      style={{ backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "9px", fontSize: "13px", cursor: "pointer" }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>

                {journalLoading ? (
                  <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Chargement du journal...</p>
                ) : journals.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "20px", color: theme.textSecondary }}>Aucun enregistrement trouvé dans le journal.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary }}>
                        <th style={{ padding: "12px" }}>ID Log</th>
                        <th style={{ padding: "12px" }}>Date</th>
                        <th style={{ padding: "12px" }}>Description de l'action</th>
                        <th style={{ padding: "12px" }}>Agent (IM)</th>
                        <th style={{ padding: "12px" }}>Document Concerné</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journals.map((log) => (
                        <tr key={log.id_jour} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: "12px", fontFamily: "monospace", color: theme.textSecondary }}>{log.id_jour}</td>
                          <td style={{ padding: "12px" }}>{log.date_action}</td>
                          <td style={{ padding: "12px", fontWeight: "500" }}>{log.desc}</td>
                          <td style={{ padding: "12px" }}>
                            <span style={{ padding: "3px 8px", borderRadius: "4px", backgroundColor: theme.hoverBg, fontWeight: "600" }}>
                              {log.im_user}
                            </span>
                          </td>
                          <td style={{ padding: "12px", color: theme.textSecondary }}>
                            {log.num_ref_doc || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 6 : PARAMÈTRES */}
          {activeTab === "parametres" && (
            <Parametres
              user={user}
              onUpdateUser={handleUpdateUser}
              activeSubTab={activeSettingsSubTab}
              setActiveSubTab={setActiveSettingsSubTab}
              theme={theme}
            />
          )}

        </main>
      </div>

      {/* MODALE CRÉATION / ÉDITION UTILISATEUR */}
      {showUserModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", width: "480px", maxWidth: "95vw", padding: "24px", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: theme.textPrimary }}>
                {editingUser ? `Modifier Agent : ${editingUser.im}` : "Créer un Nouvel Agent"}
              </h3>
              <button onClick={() => setShowUserModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: theme.textSecondary }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Matricule (IM)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  placeholder="Ex: DAG001"
                  value={userFormData.im}
                  onChange={(e) => setUserFormData({ ...userFormData, im: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: editingUser ? theme.hoverBg : theme.inputBg }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Nom</label>
                  <input
                    type="text"
                    required
                    placeholder="Nom"
                    value={userFormData.nom}
                    onChange={(e) => setUserFormData({ ...userFormData, nom: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Prénom</label>
                  <input
                    type="text"
                    required
                    placeholder="Prénom"
                    value={userFormData.prenom}
                    onChange={(e) => setUserFormData({ ...userFormData, prenom: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Mot de passe initial</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "4px", color: theme.textSecondary }}>Rôle / Service</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: `1px solid ${theme.border}`, fontSize: "13px", color: theme.textPrimary, backgroundColor: theme.inputBg }}
                >
                  <option value="DAG">DAG (Direction des Affaires Générales)</option>
                  <option value="RH">RH (Ressources Humaines)</option>
                  <option value="RSI">RSI (Responsable Système Information)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  style={{ backgroundColor: theme.hoverBg, color: theme.textPrimary, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "10px 16px", fontSize: "13px", cursor: "pointer" }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: "#3b82f6", color: "#ffffff", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  {editingUser ? "Mettre à jour" : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE PRÉVISUALISATION DU DOCUMENT */}
      {previewDoc && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: theme.cardBg, borderRadius: "12px", width: "900px", maxWidth: "95vw", height: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${theme.border}` }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", color: theme.textPrimary }}>{previewDoc.title}</h3>
                <span style={{ fontSize: "12px", color: theme.textSecondary }}>Réf: {previewDoc.num_ref}</span>
              </div>
              <button onClick={handleClosePreview} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: theme.textSecondary }}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div style={{ flex: 1, backgroundColor: "#525659", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {previewLoading ? (
                <p style={{ color: "#ffffff" }}>Chargement du document...</p>
              ) : previewUrl ? (
                <iframe src={previewUrl} title="Aperçu" style={{ width: "100%", height: "100%", border: "none" }} />
              ) : (
                <p style={{ color: "#ffffff" }}>Impossible d'afficher le document</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
import React, { useState, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

const API_USERS_URL = `${API_BASE_URL}/api/v1/users`;
const API_RSI_DEMANDES_URL = `${API_BASE_URL}/api/v1/demandes-mdp`;

export default function Parametres({
  user,
  onUpdateUser,
  activeSubTab,
  getAuthHeaders,
  theme
}) {
  const [formData, setFormData] = useState({
    nom: user?.nom || "",
    prenom: user?.prenom || "",
    email: user?.email || "",
    old_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [demandeStatus, setDemandeStatus] = useState(null);

  // Matricule de l'utilisateur connecté
  const userIm = user?.im || user?.im_dag_rh || "";

  // ------------------------------------------------------------------
  // Synchroniser les informations reçues depuis Dashboard
  // ------------------------------------------------------------------
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      nom: user?.nom || "",
      prenom: user?.prenom || "",
      email: user?.email || ""
    }));
  }, [user]);

  // ------------------------------------------------------------------
  // Récupération automatique du statut de la demande
  // ------------------------------------------------------------------
  useEffect(() => {
    if (activeSubTab === "password" && userIm) {
      fetchDemandeStatus();
    }
  }, [activeSubTab, userIm]);

  // ------------------------------------------------------------------
  // Récupérer la dernière demande de changement de mot de passe
  // ------------------------------------------------------------------
  const fetchDemandeStatus = async () => {
    if (!userIm) {
      setDemandeStatus(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_RSI_DEMANDES_URL}/statut/${encodeURIComponent(userIm)}`,
        {
          method: "GET",
          headers: getAuthHeaders()
        }
      );

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setDemandeStatus(data);
      } else if (response.status === 404) {
        // Pas encore de demande
        setDemandeStatus(null);
      } else {
        console.error(
          "Erreur récupération statut :",
          response.status,
          data
        );
        setDemandeStatus(null);
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du statut :",
        error
      );
      setDemandeStatus(null);
    }
  };

  // ------------------------------------------------------------------
  // Gestion des champs
  // ------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // ------------------------------------------------------------------
  // Envoi de la demande de changement de mot de passe
  // ------------------------------------------------------------------
  const handleDemandeChangementPassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Vérification du matricule
    if (!userIm) {
      setMessage({
        type: "error",
        text: "Impossible de récupérer votre matricule."
      });
      return;
    }

    // Vérification ancien mot de passe
    if (!formData.old_password.trim()) {
      setMessage({
        type: "error",
        text: "Veuillez saisir votre ancien mot de passe."
      });
      return;
    }

    // Vérification nouveau mot de passe
    if (!formData.new_password.trim()) {
      setMessage({
        type: "error",
        text: "Veuillez saisir votre nouveau mot de passe."
      });
      return;
    }

    // Longueur minimale
    if (formData.new_password.length < 6) {
      setMessage({
        type: "error",
        text: "Le nouveau mot de passe doit contenir au moins 6 caractères."
      });
      return;
    }

    // Confirmation
    if (
      formData.new_password !==
      formData.confirm_password
    ) {
      setMessage({
        type: "error",
        text: "Les deux nouveaux mots de passe ne correspondent pas."
      });
      return;
    }

    // Nouveau différent de l'ancien
    if (
      formData.new_password ===
      formData.old_password
    ) {
      setMessage({
        type: "error",
        text: "Le nouveau mot de passe doit être différent de l'ancien."
      });
      return;
    }

    setLoading(true);

    try {
      // --------------------------------------------------------------
      // IMPORTANT :
      // Ces noms doivent correspondre exactement au schéma FastAPI
      // --------------------------------------------------------------
      const payload = {
        im_user: userIm,
        old_password: formData.old_password,
        new_password: formData.new_password
      };

      console.log(
        "Payload envoyé à FastAPI :",
        payload
      );

      const response = await fetch(
        `${API_RSI_DEMANDES_URL}/demander`,
        {
          method: "POST",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json().catch(() => null);

      console.log(
        "Réponse FastAPI :",
        response.status,
        data
      );

      // --------------------------------------------------------------
      // SUCCÈS
      // --------------------------------------------------------------
      if (response.ok) {
        setMessage({
          type: "success",
          text:
            "Votre demande de changement de mot de passe a été transmise au RSI avec succès !"
        });

        // On utilise directement la réponse du POST
        setDemandeStatus(data);

        // Nettoyage du formulaire
        setFormData((prev) => ({
          ...prev,
          old_password: "",
          new_password: "",
          confirm_password: ""
        }));

        return;
      }

      // --------------------------------------------------------------
      // ERREUR FASTAPI
      // --------------------------------------------------------------
      let errorMessage =
        "Erreur lors de l'envoi de la demande.";

      if (Array.isArray(data?.detail)) {
        errorMessage = data.detail
          .map((item) => {
            if (item?.msg) {
              return item.msg;
            }

            return "Erreur de validation.";
          })
          .join(", ");
      } else if (data?.detail) {
        errorMessage = data.detail;
      }

      setMessage({
        type: "error",
        text: errorMessage
      });

    } catch (error) {
      console.error(
        "Erreur demande mot de passe :",
        error
      );

      setMessage({
        type: "error",
        text: "Erreur de connexion au serveur."
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Mise à jour des informations du profil
  // ------------------------------------------------------------------
  const handleUpdateInfo = async (e) => {
    e.preventDefault();

    if (!userIm) {
      setMessage({
        type: "error",
        text: "Impossible de récupérer votre matricule."
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_USERS_URL}/${encodeURIComponent(userIm)}`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email
          })
        }
      );

      const data = await response.json().catch(() => null);

      if (response.ok) {
        onUpdateUser(data);

        setMessage({
          type: "success",
          text:
            "Informations personnelles mises à jour avec succès !"
        });
      } else {
        let errorMessage =
          "Erreur lors de la mise à jour.";

        if (Array.isArray(data?.detail)) {
          errorMessage = data.detail
            .map((item) => item?.msg || "Erreur")
            .join(", ");
        } else if (data?.detail) {
          errorMessage = data.detail;
        }

        setMessage({
          type: "error",
          text: errorMessage
        });
      }
    } catch (error) {
      console.error(
        "Erreur mise à jour profil :",
        error
      );

      setMessage({
        type: "error",
        text: "Erreur de connexion au serveur."
      });
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Barre de notification du statut
  // ------------------------------------------------------------------
  const renderNotificationBar = () => {
    if (
      !demandeStatus ||
      !demandeStatus.statut
    ) {
      return null;
    }

    let bg = "rgba(245, 158, 11, 0.15)";
    let border = "#f59e0b";
    let color = "#d97706";
    let icon = "bi-clock-history";
    let text =
      "Votre demande de changement de mot de passe est en attente de validation par le RSI.";

    // --------------------------------------------------------------
    // EN ATTENTE
    // --------------------------------------------------------------
    if (
      demandeStatus.statut === "en_attente"
    ) {
      bg = "rgba(245, 158, 11, 0.15)";
      border = "#f59e0b";
      color = "#d97706";
      icon = "bi-clock-history";

      text =
        "Votre demande de changement de mot de passe est en attente de validation par le RSI.";
    }

    // --------------------------------------------------------------
    // VALIDEE
    // --------------------------------------------------------------
    else if (
      demandeStatus.statut === "validee" ||
      demandeStatus.statut === "valide"
    ) {
      bg = "rgba(16, 185, 129, 0.15)";
      border = "#10b981";
      color = "#10b981";
      icon = "bi-check-circle-fill";

      text =
        "Votre demande de changement de mot de passe a été VALIDÉE !";
    }

    // --------------------------------------------------------------
    // REJETEE
    // --------------------------------------------------------------
    else if (
      demandeStatus.statut === "rejetee" ||
      demandeStatus.statut === "rejete"
    ) {
      bg = "rgba(239, 68, 68, 0.15)";
      border = "#ef4444";
      color = "#ef4444";
      icon = "bi-x-circle-fill";

      text =
        "Votre demande de changement de mot de passe a été REJETÉE.";

      if (demandeStatus.motif) {
        text += ` Motif : ${demandeStatus.motif}`;
      }
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "13px",
          fontWeight: "600",
          backgroundColor: bg,
          border: `1px solid ${border}`,
          color: color
        }}
      >
        <i
          className={`bi ${icon}`}
          style={{ fontSize: "16px" }}
        ></i>

        <span>{text}</span>
      </div>
    );
  };

  // ------------------------------------------------------------------
  // RENDU
  // ------------------------------------------------------------------
  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderRadius: "12px",
        border: `1px solid ${theme.border}`,
        padding: "24px"
      }}
    >
      {/* ============================================================
          ONGLET : INFORMATIONS DU COMPTE
      ============================================================ */}
      {activeSubTab === "compte" && (
        <div>
          <h3
            style={{
              fontSize: "18px",
              margin: "0 0 16px 0",
              color: theme.textPrimary
            }}
          >
            Informations du compte
          </h3>

          {/* Message */}
          {message && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
                backgroundColor:
                  message.type === "success"
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                color:
                  message.type === "success"
                    ? "#10b981"
                    : "#ef4444",
                border:
                  message.type === "success"
                    ? "1px solid #10b981"
                    : "1px solid #ef4444"
              }}
            >
              {message.text}
            </div>
          )}

          <form
            onSubmit={handleUpdateInfo}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxWidth: "450px"
            }}
          >
            {/* IM */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Identifiant (IM)
              </label>

              <input
                type="text"
                value={userIm}
                disabled
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bg,
                  color: theme.textSecondary,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Nom */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Nom
              </label>

              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Prénom */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Prénom
              </label>

              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Email
              </label>

              
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px",
                fontWeight: "600",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                marginTop: "8px",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading
                ? "Enregistrement..."
                : "Mettre à jour le profil"}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================
          ONGLET : CHANGEMENT DE MOT DE PASSE
      ============================================================ */}
      {activeSubTab === "password" && (
        <div>
          <h3
            style={{
              fontSize: "18px",
              margin: "0 0 16px 0",
              color: theme.textPrimary
            }}
          >
            Changement de mot de passe
          </h3>

          {/* Statut de la demande */}
          {renderNotificationBar()}

          {/* Message du formulaire */}
          {message && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
                backgroundColor:
                  message.type === "success"
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                color:
                  message.type === "success"
                    ? "#10b981"
                    : "#ef4444",
                border:
                  message.type === "success"
                    ? "1px solid #10b981"
                    : "1px solid #ef4444"
              }}
            >
              {message.text}
            </div>
          )}

          <form
            onSubmit={handleDemandeChangementPassword}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              maxWidth: "450px"
            }}
          >
            {/* ------------------------------------------------------
                Ancien mot de passe
            ------------------------------------------------------ */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Ancien mot de passe
              </label>

              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* ------------------------------------------------------
                Nouveau mot de passe
            ------------------------------------------------------ */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Nouveau mot de passe
              </label>

              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  boxSizing: "border-box"
                }}
              />

              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                  fontSize: "11px",
                  color: theme.textSecondary
                }}
              >
                Minimum 6 caractères.
              </small>
            </div>

            {/* ------------------------------------------------------
                Confirmation
            ------------------------------------------------------ */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: theme.textSecondary,
                  marginBottom: "6px"
                }}
              >
                Confirmer le nouveau mot de passe
              </label>

              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.inputBg,
                  color: theme.textPrimary,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* ------------------------------------------------------
                Bouton
            ------------------------------------------------------ */}
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                marginTop: "8px",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading
                ? "Envoi de la demande..."
                : "Envoyer la demande au RSI"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
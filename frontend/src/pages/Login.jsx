import React, { useState } from "react";
import { loginUser } from "../services/api";

/* ================================================================
   Icônes SVG locales
================================================================ */
const Icon = ({ name, size = 20, strokeWidth = 1.9 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (name) {
    case "folder":
      return (
        <svg {...common}>
          <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
          <path d="M3.5 9.5h17" />
        </svg>
      );

    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );

    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v2" />
        </svg>
      );

    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.3" />
        </svg>
      );

    case "eyeOff":
      return (
        <svg {...common}>
          <path d="m3 3 18 18" />
          <path d="M10.6 6.7A10.2 10.2 0 0 1 12 6.5c6.1 0 9.5 5.5 9.5 5.5a18 18 0 0 1-3.1 3.3" />
          <path d="M6.2 8.2A18 18 0 0 0 2.5 12S5.9 17.5 12 17.5c1.1 0 2.1-.2 3-.5" />
        </svg>
      );

    case "arrowRight":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "map":
      return (
        <svg {...common}>
          <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      );

    case "file":
      return (
        <svg {...common}>
          <path d="M6 3.5h7l5 5V20.5H6z" />
          <path d="M13 3.5v5h5" />
          <path d="M9 13h6" />
          <path d="M9 16h4" />
        </svg>
      );

    case "tag":
      return (
        <svg {...common}>
          <path d="M20.3 13.8 13.8 20.3a2.4 2.4 0 0 1-3.4 0L3.7 13.6a2.4 2.4 0 0 1-.7-1.7V5.5A2.5 2.5 0 0 1 5.5 3h6.4c.7 0 1.3.3 1.8.7l6.6 6.7a2.4 2.4 0 0 1 0 3.4Z" />
          <circle cx="7.5" cy="7.5" r="1.1" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 19 6v5c0 4.4-2.8 8-7 10-4.2-2-7-5.6-7-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );

    case "database":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="7" ry="2.8" />
          <path d="M5 5v7c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V5" />
          <path d="M5 12v7c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-7" />
        </svg>
      );

    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m16 16 4.5 4.5" />
        </svg>
      );

    case "trash":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M9 7V4h6v3" />
          <path d="M6 7l1 13h10l1-13" />
          <path d="M10 11v5" />
          <path d="M14 11v5" />
        </svg>
      );

    case "journal":
      return (
        <svg {...common}>
          <path d="M6 3.5h11a2 2 0 0 1 2 2V20a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
          <path d="M8 8h7" />
          <path d="M8 12h7" />
          <path d="M8 16h5" />
        </svg>
      );

    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.8 12h16.4" />
          <path d="M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5S14.3 18.2 12 20.5C9.7 18.2 8.5 15.3 8.5 12S9.7 5.8 12 3.5Z" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M19 10c0 5-7 10-7 10s-7-5-7-10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="m7 7 10 10" />
          <path d="M17 7 7 17" />
        </svg>
      );

    default:
      return null;
  }
};

export default function Login({ onLoginSuccess }) {
  const [im, setIm] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ==============================================================
     CONNEXION
  ============================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanIm = im.trim();

    if (!cleanIm || !mdp) {
      setError(
        "Veuillez renseigner votre matricule et votre mot de passe."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(cleanIm, mdp);

      /*
        Le backend peut renvoyer directement :
        {
          "im": "RH001",
          "nom": "...",
          "prenom": "...",
          "type_user": "RH"
        }

        ou éventuellement :
        {
          "user": {...},
          "access_token": "..."
        }
      */
      const userData = response?.user || response;

      if (!userData) {
        throw new Error(
          "Les informations utilisateur n'ont pas été retournées par le serveur."
        );
      }

      /* ==========================================================
         1. SAUVEGARDE DE L'UTILISATEUR
      ========================================================== */
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      /* ==========================================================
         2. SAUVEGARDE DU MATRICULE
         
         C'est important pour l'upload des documents.
      ========================================================== */
      const matricule =
        userData?.im ||
        userData?.im_user ||
        userData?.im_dag_rh ||
        cleanIm;

      if (matricule) {
        localStorage.setItem("im_user", matricule);
      } else {
        localStorage.removeItem("im_user");
      }

      /* ==========================================================
         3. SAUVEGARDE DU JWT SI LE BACKEND EN FOURNIT UN
      ========================================================== */
      const token =
        response?.access_token ||
        response?.token ||
        "";

      if (token) {
        localStorage.setItem("token", token);
      } else {
        /*
          Ton endpoint actuel peut fonctionner avec X-User-IM.
          Donc on ne met surtout pas le matricule dans "token".
        */
        localStorage.removeItem("token");
      }

      /* ==========================================================
         4. CONNEXION RÉUSSIE
      ========================================================== */
      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }

    } catch (err) {
      console.error("Erreur de connexion :", err);

      const apiMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "";

      setError(
        apiMessage ||
        "Identifiants invalides ou serveur indisponible."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==============================================================
     SCROLL VERS LA CONNEXION
  ============================================================== */
  const scrollToLogin = () => {
    document.getElementById("agent-login")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div style={styles.page}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
        }

        button,
        input {
          font: inherit;
        }

        .ged-nav-btn:hover {
          background: #0a6d72 !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(8,95,99,.18) !important;
        }

        .ged-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 28px rgba(8,95,99,.25) !important;
        }

        .ged-secondary-btn:hover {
          border-color: #0a6d72 !important;
          color: #085f63 !important;
          transform: translateY(-2px);
          background: #f8fffe !important;
        }

        .ged-feature-card:hover {
          transform: translateY(-5px);
          border-color: #b8d9d6 !important;
          box-shadow: 0 20px 42px rgba(15,42,48,.10) !important;
        }

        .ged-feature-card:hover .ged-feature-line-fill {
          width: 100% !important;
        }

        .ged-input:focus {
          outline: none;
          border-color: #0e8b8f !important;
          box-shadow: 0 0 0 4px rgba(14,139,143,.12) !important;
        }

        .ged-login-submit:hover:not(:disabled) {
          background: #0b7478 !important;
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(8,95,99,.24) !important;
        }

        .ged-eye-btn:hover {
          color: #085f63 !important;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 980px) {
          .ged-header {
            padding: 14px 24px !important;
          }

          .ged-hero {
            grid-template-columns: 1fr !important;
          }

          .ged-hero-copy {
            max-width: 780px !important;
          }

          .ged-login-card {
            max-width: 560px !important;
            width: 100% !important;
            justify-self: start !important;
          }

          .ged-coverage {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 680px) {
          .ged-header {
            padding: 12px 16px !important;
          }

          .ged-brand-subtitle {
            display: none !important;
          }

          .ged-login-label {
            display: none !important;
          }

          .ged-login-top-btn {
            padding: 10px 12px !important;
          }

          .ged-hero-section {
            padding: 42px 16px 30px !important;
          }

          .ged-hero-title {
            font-size: 38px !important;
          }

          .ged-hero-actions {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .ged-hero-actions button,
          .ged-hero-actions a {
            width: 100% !important;
            justify-content: center !important;
          }

          .ged-content-section {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .ged-login-card {
            padding: 24px !important;
          }

          .ged-workflow-grid {
            grid-template-columns: 1fr !important;
          }

          .ged-footer {
            padding: 20px 16px !important;
          }

          .ged-footer-inner {
            grid-template-columns: 1fr !important;
            text-align: center !important;
          }

          .ged-footer-brand,
          .ged-footer-right {
            justify-content: center !important;
          }

          .ged-final-card {
            flex-direction: column !important;
            text-align: center !important;
          }
        }
      `}</style>

      {/* ============================================================
          HEADER
      ============================================================ */}
      <header
        className="ged-header"
        style={styles.header}
      >
        <div style={styles.brandWrap}>
          <div style={styles.logoBox} aria-label="GED">
            <Icon
              name="folder"
              size={25}
              strokeWidth={2}
            />
          </div>

          <div>
            <div style={styles.brandTitle}>
              GED Haute Matsiatra
            </div>

            <div
              className="ged-brand-subtitle"
              style={styles.brandSubtitle}
            >
              Région Haute Matsiatra — District de Fianarantsoa
            </div>
          </div>
        </div>

        <div style={styles.navActions}>
          <button
            type="button"
            className="ged-nav-btn ged-login-top-btn"
            onClick={scrollToLogin}
            style={styles.headerLoginButton}
          >
            <Icon name="lock" size={17} />
            <span className="ged-login-label">
              Espace Agent
            </span>
          </button>
        </div>
      </header>

      <main>
        {/* ==========================================================
            HERO
        ========================================================== */}
        <section
          className="ged-hero-section"
          style={styles.heroSection}
        >
          <div
            className="ged-hero"
            style={styles.heroGrid}
          >
            <div
              className="ged-hero-copy"
              style={styles.heroCopy}
            >
              <div style={styles.eyebrow}>
                <span style={styles.eyebrowDot}></span>
                PLATEFORME ADMINISTRATIVE NUMÉRIQUE
              </div>

              <div style={styles.heroBadge}>
                Gestion Électronique des Documents & Archives
                Administratives
              </div>

              <h1
                className="ged-hero-title"
                style={styles.heroTitle}
              >
                Souveraineté numérique et traçabilité des documents
                officiels
              </h1>

              <p style={styles.heroDescription}>
                Une plateforme centralisée pour la
                dématérialisation, la classification, la consultation
                et l’archivage des documents administratifs de la
                Région Haute Matsiatra.
              </p>

              <div
                className="ged-hero-actions"
                style={styles.heroActions}
              >
                <button
                  type="button"
                  className="ged-primary-btn"
                  onClick={scrollToLogin}
                  style={styles.primaryButton}
                >
                  Accéder à mon espace
                  <Icon
                    name="arrowRight"
                    size={18}
                  />
                </button>

                <a
                  href="#fonctionnalites"
                  className="ged-secondary-btn"
                  style={styles.secondaryButton}
                >
                  Découvrir la plateforme
                </a>
              </div>

              {/* =====================================================
                  INFORMATIONS RAPIDES
              ===================================================== */}
              <div style={styles.heroMetaRow}>
                <div style={styles.metaItem}>
                  <div style={styles.metaIcon}>
                    <Icon name="eye" size={17} />
                  </div>

                  <div>
                    <strong style={styles.metaTitle}>
                      Aperçu instantané
                    </strong>

                    <span style={styles.metaText}>
                      Consultez vos PDF directement dans la
                      plateforme
                    </span>
                  </div>
                </div>

                <div style={styles.metaDivider}></div>

                <div style={styles.metaItem}>
                  <div style={styles.metaIcon}>
                    <Icon name="search" size={17} />
                  </div>

                  <div>
                    <strong style={styles.metaTitle}>
                      Recherche documentaire
                    </strong>

                    <span style={styles.metaText}>
                      Retrouvez rapidement les dossiers dont vous
                      avez besoin
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================
                CARTE DE CONNEXION
            ====================================================== */}
            <div
              id="agent-login"
              className="ged-login-card"
              style={styles.loginCard}
            >
              <div style={styles.loginCardTopLine}></div>

              <div style={styles.authHeader}>
                <div style={styles.authIconBox}>
                  <Icon name="lock" size={25} />
                </div>

                <div>
                  <h2 style={styles.authTitle}>
                    Authentification Agent
                  </h2>

                  <p style={styles.authSubtitle}>
                    Utilisez vos identifiants professionnels pour
                    accéder à votre tableau de bord.
                  </p>
                </div>
              </div>

              {error && (
                <div
                  style={styles.errorBox}
                  role="alert"
                >
                  <div style={styles.errorIcon}>
                    <Icon name="x" size={16} />
                  </div>

                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={styles.fieldGroup}>
                  <label
                    htmlFor="login-im"
                    style={styles.fieldLabel}
                  >
                    Matricule (IM)
                  </label>

                  <div style={styles.inputWrap}>
                    <span style={styles.inputIcon}>
                      <Icon name="user" size={19} />
                    </span>

                    <input
                      id="login-im"
                      className="ged-input"
                      type="text"
                      value={im}
                      onChange={(e) =>
                        setIm(e.target.value)
                      }
                      placeholder="Ex. DAG001"
                      autoComplete="username"
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label
                    htmlFor="login-password"
                    style={styles.fieldLabel}
                  >
                    Mot de passe
                  </label>

                  <div style={styles.inputWrap}>
                    <span style={styles.inputIcon}>
                      <Icon name="lock" size={19} />
                    </span>

                    <input
                      id="login-password"
                      className="ged-input"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={mdp}
                      onChange={(e) =>
                        setMdp(e.target.value)
                      }
                      placeholder="Saisissez votre mot de passe"
                      autoComplete="current-password"
                      required
                      style={{
                        ...styles.input,
                        paddingRight: "48px",
                      }}
                    />

                    <button
                      type="button"
                      className="ged-eye-btn"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      style={styles.eyeButton}
                    >
                      <Icon
                        name={
                          showPassword
                            ? "eyeOff"
                            : "eye"
                        }
                        size={19}
                      />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ged-login-submit"
                  style={{
                    ...styles.submitButton,
                    ...(loading
                      ? styles.submitButtonDisabled
                      : {}),
                  }}
                >
                  {loading ? (
                    <>
                      <span style={styles.spinner}></span>
                      Vérification en cours...
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <Icon
                        name="arrowRight"
                        size={18}
                      />
                    </>
                  )}
                </button>
              </form>

              <div style={styles.loginFooter}>
                <Icon name="user" size={15} />
                <span>Espace réservé aux agents</span>

                <span style={styles.footerDot}>
                  •
                </span>

                <span>
                  Accès au tableau de bord administratif
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            COUVERTURE TERRITORIALE
        ========================================================== */}
        <section
          className="ged-content-section"
          style={styles.contentSection}
        >
          <div
            className="ged-coverage"
            style={styles.coverageGrid}
          >
            <div>
              <div style={styles.sectionKicker}>
                <Icon name="map" size={18} />
                TERRITOIRE
              </div>

              <h2 style={styles.sectionTitle}>
                Couverture territoriale
              </h2>

              <p style={styles.sectionSubtitle}>
                Le système GED accompagne les services
                administratifs régionaux à Fianarantsoa dans la
                gestion et la consultation des dossiers numériques.
              </p>

              <div style={styles.locationCard}>
                <div style={styles.locationIcon}>
                  <Icon name="pin" size={22} />
                </div>

                <div>
                  <strong style={styles.locationTitle}>
                    Fianarantsoa
                  </strong>

                  <span style={styles.locationDesc}>
                    Chef-lieu de la Région Haute Matsiatra
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.mapBox}>
              <iframe
                title="Carte Haute Matsiatra - Fianarantsoa"
                width="100%"
                height="350"
                style={{
                  border: 0,
                  display: "block",
                }}
                loading="lazy"
                allowFullScreen
                src="https://www.openstreetmap.org/export/embed.html?bbox=46.9000%2C-21.6000%2C47.3000%2C-21.3000&layer=mapnik&marker=-21.4536%2C47.0858"
              ></iframe>
            </div>
          </div>
        </section>

        {/* ==========================================================
            FONCTIONNALITÉS
        ========================================================== */}
        <section
          id="fonctionnalites"
          className="ged-content-section"
          style={styles.workflowSection}
        >
          <div style={styles.sectionHeadingCenter}>
            <div
              style={{
                ...styles.sectionKicker,
                justifyContent: "center",
              }}
            >
              <Icon name="folder" size={18} />
              OUTILS DE LA PLATEFORME
            </div>

            <h2 style={styles.sectionTitle}>
              Une plateforme pensée pour votre quotidien
            </h2>

            <p
              style={{
                ...styles.sectionSubtitle,
                maxWidth: "720px",
                margin: "0 auto",
              }}
            >
              Retrouvez, consultez et gérez vos dossiers
              administratifs depuis un même espace avec des outils
              conçus pour simplifier le travail des agents.
            </p>
          </div>

          <div
            className="ged-workflow-grid"
            style={styles.workflowGrid}
          >
            <FeatureCard
              icon="search"
              number="01"
              title="Recherche instantanée"
              description="Retrouvez rapidement un dossier grâce à la référence, au titre, à la catégorie ou à l’année."
            />

            <FeatureCard
              icon="eye"
              number="02"
              title="Aperçu des documents"
              description="Consultez directement vos PDF dans la plateforme sans devoir les télécharger sur votre ordinateur."
            />

            <FeatureCard
              icon="trash"
              number="03"
              title="Corbeille intelligente"
              description="Les documents supprimés restent récupérables pendant une période définie avant leur suppression définitive."
            />

            <FeatureCard
              icon="journal"
              number="04"
              title="Journal d’activité"
              description="Gardez une vision claire des consultations, modifications, ajouts et opérations réalisées sur les documents."
            />
          </div>
        </section>

        {/* ==========================================================
            BLOC FINAL
        ========================================================== */}
        <section
          className="ged-content-section"
          style={styles.finalSection}
        >
          <div
            className="ged-final-card"
            style={styles.finalCard}
          >
            <div style={styles.finalIcon}>
              <Icon name="folder" size={28} />
            </div>

            <div style={styles.finalContent}>
              <div style={styles.sectionKicker}>
                <Icon name="arrowRight" size={16} />
                ESPACE ADMINISTRATIF
              </div>

              <h2 style={styles.finalTitle}>
                Accédez à vos documents depuis un espace unique
              </h2>

              <p style={styles.finalText}>
                Consultez vos dossiers, effectuez vos recherches et
                gérez vos documents depuis votre tableau de bord
                administratif.
              </p>

              <button
                type="button"
                className="ged-primary-btn"
                onClick={scrollToLogin}
                style={styles.finalButton}
              >
                Ouvrir mon espace
                <Icon
                  name="arrowRight"
                  size={18}
                />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer
        className="ged-footer"
        style={styles.footer}
      >
        <div
          className="ged-footer-inner"
          style={styles.footerInner}
        >
          <div
            className="ged-footer-brand"
            style={styles.footerBrand}
          >
            <div style={styles.footerLogo}>
              <Icon name="folder" size={18} />
            </div>

            <div>
              <strong style={styles.footerBrandTitle}>
                GED Haute Matsiatra
              </strong>

              <span style={styles.footerBrandSub}>
                Région Haute Matsiatra — District de Fianarantsoa
              </span>
            </div>
          </div>

          <div style={styles.footerCenter}>
            © 2026 Région Haute Matsiatra. Tous droits réservés.
          </div>

          <div
            className="ged-footer-right"
            style={styles.footerRight}
          >
            <Icon name="globe" size={15} />
            <span>
              Plateforme administrative numérique
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}


/* ================================================================
   FEATURE CARD
================================================================ */
function FeatureCard({
  icon,
  number,
  title,
  description,
}) {
  return (
    <div
      className="ged-feature-card"
      style={styles.featureCard}
    >
      <div style={styles.featureTop}>
        <div style={styles.featureIcon}>
          <Icon name={icon} size={22} />
        </div>

        <span style={styles.featureNumber}>
          {number}
        </span>
      </div>

      <h3 style={styles.featureTitle}>
        {title}
      </h3>

      <p style={styles.featureDescription}>
        {description}
      </p>

      <div style={styles.featureLine}>
        <span
          className="ged-feature-line-fill"
          style={styles.featureLineFill}
        ></span>
      </div>
    </div>
  );
}


/* ================================================================
   STYLES
================================================================ */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f8f9",
    color: "#16343a",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* =============================================================
     HEADER
  ============================================================= */
  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 48px",
    background: "rgba(255,255,255,.94)",
    borderBottom: "1px solid #dfe9eb",
    backdropFilter: "blur(16px)",
    boxShadow: "0 4px 18px rgba(14,59,67,.05)",
  },

  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minWidth: 0,
  },

  logoBox: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    borderRadius: "12px",
    background:
      "linear-gradient(145deg,#0c7e82,#085f63)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 9px 20px rgba(8,95,99,.18)",
  },

  brandTitle: {
    fontSize: "18px",
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#0e3b43",
    letterSpacing: "-.02em",
  },

  brandSubtitle: {
    marginTop: "4px",
    fontSize: "11.5px",
    color: "#688087",
    whiteSpace: "nowrap",
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  headerLoginButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    borderRadius: "11px",
    padding: "11px 16px",
    background: "#085f63",
    color: "#fff",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all .2s ease",
    boxShadow:
      "0 7px 17px rgba(8,95,99,.14)",
  },

  /* =============================================================
     HERO
  ============================================================= */
  heroSection: {
    padding: "78px 48px 64px",
    background:
      "radial-gradient(circle at 90% 15%, rgba(42,148,150,.13), transparent 28%), linear-gradient(180deg,#ffffff 0%,#f5f9fa 100%)",
    borderBottom: "1px solid #e3ecee",
  },

  heroGrid: {
    maxWidth: "1260px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.15fr .85fr",
    alignItems: "center",
    gap: "64px",
  },

  heroCopy: {
    maxWidth: "760px",
  },

  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".14em",
    color: "#0a7175",
    marginBottom: "14px",
  },

  eyebrowDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#0f9698",
    boxShadow:
      "0 0 0 5px rgba(15,150,152,.1)",
  },

  heroBadge: {
    width: "fit-content",
    maxWidth: "100%",
    padding: "7px 12px",
    border: "1px solid #c9e2e1",
    borderRadius: "999px",
    background: "#effafa",
    color: "#176a6d",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "18px",
  },

  heroTitle: {
    margin: 0,
    maxWidth: "760px",
    fontSize: "clamp(38px,5vw,66px)",
    lineHeight: 1.02,
    letterSpacing: "-0.045em",
    fontWeight: 850,
    color: "#0b3941",
  },

  heroDescription: {
    maxWidth: "720px",
    margin: "22px 0 0",
    fontSize: "16px",
    lineHeight: 1.72,
    color: "#587078",
  },

  heroActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "30px",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px 20px",
    border: "none",
    borderRadius: "11px",
    background: "#085f63",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 750,
    cursor: "pointer",
    transition: "all .2s ease",
    boxShadow:
      "0 10px 24px rgba(8,95,99,.2)",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "13px 18px",
    border: "1px solid #cbdcde",
    borderRadius: "11px",
    background: "#fff",
    color: "#2f5960",
    fontSize: "13px",
    fontWeight: 700,
    textDecoration: "none",
    transition: "all .2s ease",
  },

  heroMetaRow: {
    display: "flex",
    alignItems: "stretch",
    gap: "18px",
    marginTop: "34px",
    maxWidth: "680px",
  },

  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  },

  metaIcon: {
    width: "34px",
    height: "34px",
    flexShrink: 0,
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e8f5f4",
    color: "#0b7376",
  },

  metaTitle: {
    display: "block",
    fontSize: "11px",
    color: "#1a4b52",
    marginBottom: "2px",
  },

  metaText: {
    display: "block",
    fontSize: "10.5px",
    color: "#789098",
    lineHeight: 1.4,
  },

  metaDivider: {
    width: "1px",
    background: "#d9e5e7",
  },

  /* =============================================================
     LOGIN CARD
  ============================================================= */
  loginCard: {
    position: "relative",
    width: "100%",
    maxWidth: "490px",
    justifySelf: "end",
    background: "#fff",
    border: "1px solid #dbe7e9",
    borderRadius: "20px",
    padding: "30px",
    boxShadow:
      "0 30px 70px rgba(10,50,57,.13)",
  },

  loginCardTopLine: {
    position: "absolute",
    left: "30px",
    right: "30px",
    top: 0,
    height: "4px",
    borderRadius: "0 0 8px 8px",
    background:
      "linear-gradient(90deg,#085f63,#2b9ea0)",
  },

  authHeader: {
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
    marginBottom: "25px",
  },

  authIconBox: {
    width: "46px",
    height: "46px",
    flexShrink: 0,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e9f6f5",
    color: "#085f63",
  },

  authTitle: {
    margin: "0 0 5px",
    fontSize: "21px",
    fontWeight: 800,
    color: "#0e3b43",
    letterSpacing: "-.02em",
  },

  authSubtitle: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.55,
    color: "#72868c",
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "9px",
    padding: "11px 12px",
    marginBottom: "18px",
    borderRadius: "10px",
    border: "1px solid #f1caca",
    background: "#fff6f6",
    color: "#a53e3e",
    fontSize: "12px",
    lineHeight: 1.45,
  },

  errorIcon: {
    width: "22px",
    height: "22px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#fbe0e0",
  },

  fieldGroup: {
    marginBottom: "18px",
  },

  fieldLabel: {
    display: "block",
    marginBottom: "7px",
    fontSize: "12px",
    fontWeight: 750,
    color: "#2c4d53",
  },

  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  inputIcon: {
    position: "absolute",
    left: "13px",
    zIndex: 1,
    color: "#7b9297",
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },

  input: {
    width: "100%",
    height: "49px",
    borderRadius: "11px",
    border: "1px solid #cfdddf",
    background: "#fbfdfd",
    color: "#15383f",
    padding: "0 14px 0 43px",
    fontSize: "13px",
    transition: "all .2s ease",
  },

  eyeButton: {
    position: "absolute",
    right: "8px",
    width: "35px",
    height: "35px",
    border: "none",
    background: "transparent",
    color: "#809398",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "color .2s ease",
  },

  submitButton: {
    width: "100%",
    minHeight: "49px",
    marginTop: "5px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    border: "none",
    borderRadius: "11px",
    background: "#085f63",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 800,
    transition: "all .2s ease",
    boxShadow:
      "0 10px 22px rgba(8,95,99,.17)",
  },

  submitButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.8,
  },

  spinner: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    border:
      "2px solid rgba(255,255,255,.4)",
    borderTopColor: "#fff",
    animation:
      "spin .8s linear infinite",
  },

  loginFooter: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "16px",
    paddingTop: "14px",
    borderTop: "1px solid #edf2f3",
    color: "#778b90",
    fontSize: "10.5px",
    textAlign: "center",
  },

  footerDot: {
    color: "#b5c4c7",
  },

  /* =============================================================
     SECTIONS
  ============================================================= */
  contentSection: {
    maxWidth: "1260px",
    margin: "0 auto",
    padding: "72px 48px 0",
  },

  coverageGrid: {
    display: "grid",
    gridTemplateColumns: ".82fr 1.18fr",
    gap: "50px",
    alignItems: "center",
  },

  sectionKicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "10px",
    fontSize: "10.5px",
    letterSpacing: ".14em",
    fontWeight: 800,
    color: "#0b777a",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.14,
    letterSpacing: "-.03em",
    fontWeight: 800,
    color: "#123f47",
  },

  sectionSubtitle: {
    margin: "12px 0 0",
    maxWidth: "650px",
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#71858b",
  },

  locationCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginTop: "26px",
    padding: "16px",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg,#edf9f8,#f8fcfc)",
    border: "1px solid #d7ebea",
    maxWidth: "470px",
  },

  locationIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fff",
    color: "#0b7478",
    border: "1px solid #d3e8e7",
  },

  locationTitle: {
    display: "block",
    fontSize: "13px",
    fontWeight: 800,
    color: "#20565d",
    marginBottom: "3px",
  },

  locationDesc: {
    display: "block",
    fontSize: "11px",
    color: "#7a9095",
  },

  mapBox: {
    overflow: "hidden",
    borderRadius: "17px",
    border: "1px solid #dce8e9",
    background: "#fff",
    boxShadow:
      "0 18px 50px rgba(14,59,67,.08)",
  },

  /* =============================================================
     FONCTIONNALITÉS
  ============================================================= */
  workflowSection: {
    maxWidth: "1260px",
    margin: "0 auto",
    padding: "76px 48px 84px",
  },

  sectionHeadingCenter: {
    textAlign: "center",
    marginBottom: "34px",
  },

  workflowGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4,minmax(0,1fr))",
    gap: "18px",
  },

  featureCard: {
    position: "relative",
    minHeight: "235px",
    padding: "22px",
    background: "#fff",
    border: "1px solid #dce7e9",
    borderRadius: "17px",
    boxShadow:
      "0 10px 24px rgba(14,59,67,.035)",
    transition: "all .22s ease",
  },

  featureTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  featureIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#0b777a",
    background: "#e8f6f5",
  },

  featureNumber: {
    fontSize: "11px",
    letterSpacing: ".08em",
    fontWeight: 850,
    color: "#a0b4b9",
  },

  featureTitle: {
    margin: "23px 0 9px",
    fontSize: "15px",
    lineHeight: 1.3,
    color: "#1a4b52",
    fontWeight: 800,
  },

  featureDescription: {
    margin: 0,
    fontSize: "12px",
    lineHeight: 1.7,
    color: "#74878c",
  },

  featureLine: {
    position: "absolute",
    left: "22px",
    right: "22px",
    bottom: "18px",
    height: "2px",
    background: "#eef3f4",
    overflow: "hidden",
    borderRadius: "999px",
  },

  featureLineFill: {
    display: "block",
    width: "28%",
    height: "100%",
    background: "#0e8b8f",
    borderRadius: "999px",
    transition: "width .35s ease",
  },

  /* =============================================================
     FINAL CTA
  ============================================================= */
  finalSection: {
    maxWidth: "1260px",
    margin: "0 auto",
    padding: "0 48px 84px",
  },

  finalCard: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    padding: "30px",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg,#eaf7f6,#f6fbfb)",
    border: "1px solid #d6eae8",
    boxShadow:
      "0 16px 40px rgba(14,59,67,.06)",
  },

  finalIcon: {
    width: "64px",
    height: "64px",
    flexShrink: 0,
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    color: "#0b7478",
    border: "1px solid #d4e8e7",
  },

  finalContent: {
    flex: 1,
  },

  finalTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.2,
    letterSpacing: "-.025em",
    fontWeight: 800,
    color: "#123f47",
  },

  finalText: {
    margin: "9px 0 20px",
    maxWidth: "760px",
    fontSize: "13px",
    lineHeight: 1.7,
    color: "#71858b",
  },

  finalButton: {
    padding: "12px 18px",
    fontSize: "12.5px",
  },

  /* =============================================================
     FOOTER
  ============================================================= */
  footer: {
    background: "#0d4148",
    color: "#fff",
    borderTop: "1px solid #1d5960",
  },

  footerInner: {
    maxWidth: "1260px",
    margin: "0 auto",
    padding: "21px 48px",
    display: "grid",
    gridTemplateColumns:
      "1fr auto 1fr",
    alignItems: "center",
    gap: "20px",
  },

  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  footerLogo: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background:
      "rgba(255,255,255,.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  footerBrandTitle: {
    display: "block",
    fontSize: "11px",
    fontWeight: 800,
  },

  footerBrandSub: {
    display: "block",
    marginTop: "2px",
    fontSize: "9px",
    color: "#b7c9cd",
  },

  footerCenter: {
    fontSize: "10.5px",
    color: "#dce7e9",
    textAlign: "center",
  },

  footerRight: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "6px",
    fontSize: "10px",
    color: "#b7c9cd",
  },
};
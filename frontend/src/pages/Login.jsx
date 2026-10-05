import React, { useState } from "react";
import { loginUser } from "../services/api";

/* ============================================================
   ICÔNES SVG
============================================================ */

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

    case "search":
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.3" />
          <path d="m16 16 4.5 4.5" />
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

    case "pin":
      return (
        <svg {...common}>
          <path d="M19 10c0 5-7 10-7 10s-7-5-7-10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.2" />
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


/* ============================================================
   LOGIN
============================================================ */

export default function Login({ onLoginSuccess }) {
  const [im, setIm] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ==========================================================
     CONNEXION
  ========================================================== */

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
        Le backend peut renvoyer directement l'utilisateur
        ou un objet contenant "user".
      */

      const userData = response?.user || response;

      if (!userData) {
        throw new Error(
          "Les informations utilisateur n'ont pas été retournées par le serveur."
        );
      }

      /* -------------------------------------------------------
         SAUVEGARDE DE L'UTILISATEUR
      ------------------------------------------------------- */

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      /* -------------------------------------------------------
         SAUVEGARDE DU MATRICULE
      ------------------------------------------------------- */

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

      /* -------------------------------------------------------
         SAUVEGARDE DU TOKEN SI DISPONIBLE
      ------------------------------------------------------- */

      const token =
        response?.access_token ||
        response?.token ||
        "";

      if (token) {
        localStorage.setItem("token", token);
      } else {
        localStorage.removeItem("token");
      }

      /* -------------------------------------------------------
         CONNEXION RÉUSSIE
      ------------------------------------------------------- */

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


  /* ==========================================================
     SCROLL VERS LA CONNEXION
  ========================================================== */

  const scrollToLogin = () => {
    document
      .getElementById("agent-login")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  };


  /* ==========================================================
     RENDER
  ========================================================== */

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
        }

        .ged-primary-btn:hover {
          background: #0a6d72 !important;
          transform: translateY(-1px);
        }

        .ged-secondary-btn:hover {
          border-color: #0a6d72 !important;
          color: #085f63 !important;
        }

        .ged-feature-card:hover {
          transform: translateY(-3px);
          border-color: #b8d9d6 !important;
          box-shadow: 0 14px 30px rgba(15,42,48,.08) !important;
        }

        .ged-input:focus {
          outline: none;
          border-color: #0e8b8f !important;
          box-shadow: 0 0 0 3px rgba(14,139,143,.10) !important;
        }

        .ged-login-submit:hover:not(:disabled) {
          background: #0b7478 !important;
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
            max-width: 800px !important;
          }

          .ged-login-card {
            max-width: 560px !important;
            justify-self: start !important;
          }

          .ged-coverage {
            grid-template-columns: 1fr !important;
          }

          .ged-workflow-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
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

          .ged-hero-section {
            padding: 42px 16px 34px !important;
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

          <div
            style={styles.logoBox}
            aria-label="GED"
          >
            <Icon
              name="folder"
              size={24}
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
            className="ged-nav-btn"
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

            {/* ------------------------------------------------------
                TEXTE
            ------------------------------------------------------ */}

            <div
              className="ged-hero-copy"
              style={styles.heroCopy}
            >

              <div style={styles.eyebrow}>
                <span style={styles.eyebrowDot}></span>
                PLATEFORME ADMINISTRATIVE NUMÉRIQUE
              </div>


              <div style={styles.heroBadge}>
                Gestion Électronique des Documents
              </div>


              <h1
                className="ged-hero-title"
                style={styles.heroTitle}
              >
                Gestion numérique des documents
                administratifs
              </h1>


              <p style={styles.heroDescription}>
                Une plateforme pour numériser, organiser
                et consulter les documents administratifs
                de la Région Haute Matsiatra.
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
                  Voir les fonctionnalités
                </a>

              </div>

            </div>


            {/* ------------------------------------------------------
                CONNEXION
            ------------------------------------------------------ */}

            <div
              id="agent-login"
              className="ged-login-card"
              style={styles.loginCard}
            >

              <div style={styles.loginCardTopLine}></div>


              <div style={styles.authHeader}>

                <div style={styles.authIconBox}>
                  <Icon name="lock" size={24} />
                </div>


                <div>

                  <h2 style={styles.authTitle}>
                    Authentification
                  </h2>

                  <p style={styles.authSubtitle}>
                    Connectez-vous avec vos identifiants professionnels.
                  </p>

                </div>

              </div>


              {/* ----------------------------------------------------
                  ERREUR
              ---------------------------------------------------- */}

              {error && (
                <div
                  style={styles.errorBox}
                  role="alert"
                >

                  <div style={styles.errorIcon}>
                    <Icon name="x" size={15} />
                  </div>

                  <span>{error}</span>

                </div>
              )}


              {/* ----------------------------------------------------
                  FORMULAIRE
              ---------------------------------------------------- */}

              <form onSubmit={handleSubmit}>

                {/* MATRICULE */}

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


                {/* MOT DE PASSE */}

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
                        setShowPassword(
                          (prev) => !prev
                        )
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


                {/* BOUTON */}

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
                      Connexion...
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


              {/* ----------------------------------------------------
                  BAS DE FORMULAIRE
              ---------------------------------------------------- */}

              <div style={styles.loginFooter}>

                <Icon name="user" size={15} />

                <span>
                  Espace réservé aux agents
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
                administratifs régionaux dans la gestion
                et la consultation des dossiers numériques.
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


            {/* CARTE */}

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
              FONCTIONNALITÉS
            </div>


            <h2 style={styles.sectionTitle}>
              Les outils de la plateforme
            </h2>


            <p
              style={{
                ...styles.sectionSubtitle,
                maxWidth: "680px",
                margin: "12px auto 0",
              }}
            >
              Retrouvez les principales fonctions de gestion
              des documents dans un seul espace.
            </p>

          </div>


          <div
            className="ged-workflow-grid"
            style={styles.workflowGrid}
          >

            <FeatureCard
              icon="folder"
              number="01"
              title="Gestion des dossiers"
              description="Ajoutez et organisez les documents administratifs dans un espace centralisé."
            />


            <FeatureCard
              icon="search"
              number="02"
              title="Recherche"
              description="Retrouvez rapidement un document grâce à sa référence, son titre ou sa catégorie."
            />


            <FeatureCard
              icon="journal"
              number="03"
              title="Suivi des activités"
              description="Consultez les opérations effectuées sur les documents et les dossiers."
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
                Un espace unique pour vos documents
              </h2>


              <p style={styles.finalText}>
                Consultez vos dossiers, effectuez vos recherches
                et gérez vos documents depuis votre tableau de bord.
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
                Région Haute Matsiatra — Fianarantsoa
              </span>

            </div>

          </div>


          <div style={styles.footerCenter}>
            © 2026 Région Haute Matsiatra.
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
          <Icon
            name={icon}
            size={22}
          />
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


      <div style={styles.featureLine}></div>

    </div>
  );
}


/* ================================================================
   STYLES
================================================================ */

const styles = {

  /* =============================================================
     PAGE
  ============================================================= */

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

    background: "#ffffff",

    borderBottom: "1px solid #dfe9eb",

    boxShadow:
      "0 2px 12px rgba(14,59,67,.04)",
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

    borderRadius: "10px",

    background: "#085f63",

    color: "#ffffff",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  },


  headerLoginButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    gap: "8px",

    border: "none",

    borderRadius: "8px",

    padding: "10px 15px",

    background: "#085f63",

    color: "#ffffff",

    fontWeight: 700,

    fontSize: "13px",

    cursor: "pointer",

    transition: "all .2s ease",
  },


  /* =============================================================
     HERO
  ============================================================= */

  heroSection: {
    padding: "70px 48px 60px",

    background: "#ffffff",

    borderBottom: "1px solid #e3ecee",
  },


  heroGrid: {
    maxWidth: "1180px",

    margin: "0 auto",

    display: "grid",

    gridTemplateColumns: "1.1fr .9fr",

    alignItems: "center",

    gap: "60px",
  },


  heroCopy: {
    maxWidth: "700px",
  },


  eyebrow: {
    display: "inline-flex",
    alignItems: "center",

    gap: "8px",

    fontSize: "11px",

    fontWeight: 800,

    letterSpacing: ".13em",

    color: "#0a7175",

    marginBottom: "14px",
  },


  eyebrowDot: {
    width: "7px",
    height: "7px",

    borderRadius: "50%",

    background: "#0f9698",
  },


  heroBadge: {
    width: "fit-content",

    padding: "6px 11px",

    border: "1px solid #c9e2e1",

    borderRadius: "7px",

    background: "#effafa",

    color: "#176a6d",

    fontSize: "12px",

    fontWeight: 700,

    marginBottom: "18px",
  },


  heroTitle: {
    margin: 0,

    maxWidth: "680px",

    fontSize: "clamp(38px,5vw,62px)",

    lineHeight: 1.05,

    letterSpacing: "-0.04em",

    fontWeight: 800,

    color: "#0b3941",
  },


  heroDescription: {
    maxWidth: "680px",

    margin: "20px 0 0",

    fontSize: "16px",

    lineHeight: 1.7,

    color: "#587078",
  },


  heroActions: {
    display: "flex",
    alignItems: "center",

    gap: "12px",

    marginTop: "28px",
  },


  primaryButton: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "10px",

    padding: "13px 19px",

    border: "none",

    borderRadius: "9px",

    background: "#085f63",

    color: "#ffffff",

    fontSize: "13px",

    fontWeight: 750,

    cursor: "pointer",

    transition: "all .2s ease",
  },


  secondaryButton: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    padding: "12px 17px",

    border: "1px solid #cbdcde",

    borderRadius: "9px",

    background: "#ffffff",

    color: "#2f5960",

    fontSize: "13px",

    fontWeight: 700,

    textDecoration: "none",

    transition: "all .2s ease",
  },


  /* =============================================================
     LOGIN CARD
  ============================================================= */

  loginCard: {
    position: "relative",

    width: "100%",

    maxWidth: "470px",

    justifySelf: "end",

    background: "#ffffff",

    border: "1px solid #dbe7e9",

    borderRadius: "16px",

    padding: "28px",

    boxShadow:
      "0 18px 45px rgba(10,50,57,.09)",
  },


  loginCardTopLine: {
    position: "absolute",

    left: "26px",
    right: "26px",
    top: 0,

    height: "3px",

    borderRadius: "0 0 6px 6px",

    background: "#085f63",
  },


  authHeader: {
    display: "flex",

    gap: "13px",

    alignItems: "flex-start",

    marginBottom: "24px",
  },


  authIconBox: {
    width: "44px",
    height: "44px",

    flexShrink: 0,

    borderRadius: "10px",

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
  },


  authSubtitle: {
    margin: 0,

    fontSize: "12px",

    lineHeight: 1.5,

    color: "#72868c",
  },


  /* =============================================================
     ERREUR
  ============================================================= */

  errorBox: {
    display: "flex",

    alignItems: "flex-start",

    gap: "9px",

    padding: "11px 12px",

    marginBottom: "18px",

    borderRadius: "9px",

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


  /* =============================================================
     INPUTS
  ============================================================= */

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

    height: "48px",

    borderRadius: "9px",

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

    borderRadius: "7px",
  },


  /* =============================================================
     BOUTON LOGIN
  ============================================================= */

  submitButton: {
    width: "100%",

    minHeight: "48px",

    marginTop: "5px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "9px",

    border: "none",

    borderRadius: "9px",

    background: "#085f63",

    color: "#ffffff",

    cursor: "pointer",

    fontSize: "13px",

    fontWeight: 800,

    transition: "all .2s ease",
  },


  submitButtonDisabled: {
    cursor: "not-allowed",

    opacity: 0.8,
  },


  spinner: {
    width: "15px",
    height: "15px",

    borderRadius: "50%",

    border: "2px solid rgba(255,255,255,.4)",

    borderTopColor: "#ffffff",

    animation: "spin .8s linear infinite",
  },


  loginFooter: {
    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "6px",

    marginTop: "15px",

    paddingTop: "13px",

    borderTop: "1px solid #edf2f3",

    color: "#778b90",

    fontSize: "10.5px",

    textAlign: "center",
  },


  /* =============================================================
     SECTIONS
  ============================================================= */

  contentSection: {
    maxWidth: "1180px",

    margin: "0 auto",

    padding: "68px 48px 0",
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

    letterSpacing: ".13em",

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

    marginTop: "24px",

    padding: "15px",

    borderRadius: "11px",

    background: "#f3faf9",

    border: "1px solid #d7ebea",

    maxWidth: "470px",
  },


  locationIcon: {
    width: "42px",
    height: "42px",

    borderRadius: "10px",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    background: "#ffffff",

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

    borderRadius: "14px",

    border: "1px solid #dce8e9",

    background: "#ffffff",

    boxShadow:
      "0 12px 32px rgba(14,59,67,.06)",
  },


  /* =============================================================
     FONCTIONNALITÉS
  ============================================================= */

  workflowSection: {
    maxWidth: "1180px",

    margin: "0 auto",

    padding: "72px 48px 76px",
  },


  sectionHeadingCenter: {
    textAlign: "center",

    marginBottom: "30px",
  },


  workflowGrid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(3,minmax(0,1fr))",

    gap: "18px",
  },


  featureCard: {
    position: "relative",

    minHeight: "215px",

    padding: "22px",

    background: "#ffffff",

    border: "1px solid #dce7e9",

    borderRadius: "14px",

    boxShadow:
      "0 8px 20px rgba(14,59,67,.035)",

    transition: "all .2s ease",
  },


  featureTop: {
    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",
  },


  featureIcon: {
    width: "44px",
    height: "44px",

    borderRadius: "10px",

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
    margin: "21px 0 9px",

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

    bottom: "17px",

    height: "2px",

    background: "#eef3f4",

    borderRadius: "999px",
  },


  /* =============================================================
     BLOC FINAL
  ============================================================= */

  finalSection: {
    maxWidth: "1180px",

    margin: "0 auto",

    padding: "0 48px 76px",
  },


  finalCard: {
    display: "flex",

    alignItems: "center",

    gap: "24px",

    padding: "28px",

    borderRadius: "14px",

    background: "#f1f9f8",

    border: "1px solid #d6eae8",
  },


  finalIcon: {
    width: "60px",

    height: "60px",

    flexShrink: 0,

    borderRadius: "14px",

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

    fontSize: "23px",

    lineHeight: 1.2,

    letterSpacing: "-.025em",

    fontWeight: 800,

    color: "#123f47",
  },


  finalText: {
    margin: "9px 0 18px",

    maxWidth: "760px",

    fontSize: "13px",

    lineHeight: 1.7,

    color: "#71858b",
  },


  finalButton: {
    padding: "11px 17px",

    fontSize: "12.5px",
  },


  /* =============================================================
     FOOTER
  ============================================================= */

  footer: {
    background: "#0d4148",

    color: "#ffffff",

    borderTop: "1px solid #1d5960",
  },


  footerInner: {
    maxWidth: "1180px",

    margin: "0 auto",

    padding: "20px 48px",

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

    borderRadius: "8px",

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
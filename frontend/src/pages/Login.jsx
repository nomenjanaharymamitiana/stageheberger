import React, { useState } from "react";
import { loginUser } from "../services/api";

/* ================================================================
   Icônes SVG locales
   Aucun emoji, aucune librairie supplémentaire nécessaire.
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
    ariaHidden: true,
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
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12M18 6 6 18" />
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
    default:
      return null;
  }
};

export default function Login({ onLoginSuccess }) {
  const [lang, setLang] = useState("fr");
  const [im, setIm] = useState("");
  const [mdp, setMdp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const t = {
    fr: {
      appName: "GED Haute Matsiatra",
      appTagline: "Gestion Électronique des Documents & Archives Administratives",
      districtName: "Région Haute Matsiatra — District de Fianarantsoa",
      loginBtn: "Espace Agent",
      heroEyebrow: "PLATEFORME ADMINISTRATIVE NUMÉRIQUE",
      heroTitle: "Souveraineté numérique et traçabilité des documents officiels",
      heroDesc:
        "Une plateforme centralisée pour la dématérialisation, la classification, la consultation et l’archivage sécurisé des documents administratifs de la Région Haute Matsiatra.",
      accessBtn: "Accéder à mon espace",
      exploreBtn: "Découvrir le système",
      coverageTitle: "Couverture territoriale",
      coverageSubtitle:
        "Le système GED interconnecte les services administratifs régionaux à Fianarantsoa.",
      locationTitle: "Fianarantsoa",
      locationDesc: "Chef-lieu de la Région Haute Matsiatra",
      workflowTitle: "Fonctionnement du système GED",
      workflowSubtitle:
        "Une chaîne de traitement structurée pour accélérer les démarches et sécuriser les archives.",
      step1Title: "Numérisation & collecte",
      step1Desc:
        "Capture centralisée des courriers, actes administratifs et dossiers sous format numérique.",
      step2Title: "Indexation & méta-données",
      step2Desc:
        "Association des matricules, catégories, types de documents et mots-clés d’archivage.",
      step3Title: "Traçabilité & suivi",
      step3Desc:
        "Journalisation des consultations, modifications et suppressions réalisées par les agents habilités.",
      step4Title: "Archivage sécurisé",
      step4Desc:
        "Stockage protégé et sauvegardé pour garantir la pérennité et la confidentialité des dossiers.",
      authTitle: "Authentification Agent",
      authSubtitle: "Utilisez vos identifiants professionnels pour accéder à votre tableau de bord.",
      labelIm: "Matricule (IM)",
      labelMdp: "Mot de passe",
      placeholderIm: "Ex. DAG001",
      placeholderMdp: "Saisissez votre mot de passe",
      btnSubmit: "Se connecter",
      btnLoading: "Vérification en cours...",
      secureAccess: "Connexion sécurisée",
      authHint: "Accès réservé aux agents habilités",
      footerRights: "© 2026 Région Haute Matsiatra. Tous droits réservés.",
      connectionError: "Identifiants invalides ou serveur indisponible.",
      discover: "Voir le fonctionnement",
    },
    mg: {
      appName: "GED Haute Matsiatra",
      appTagline: "Fitantanana ny Taratasy sy Tahirin-kevitra Ara-panjakana",
      districtName: "Faritra Haute Matsiatra — Distrikan'i Fianarantsoa",
      loginBtn: "Espace Agent",
      heroEyebrow: "SEHATRA NOMERIKA HO AN'NY FITANTANANA",
      heroTitle: "Fitantanana nomerika sy fanaraha-maso ireo antontan-taratasy ofisialy",
      heroDesc:
        "Sehatra iray iombonana ho an'ny numérisation, fanasokajiana, fikarohana ary fitahirizana azo antoka ireo antontan-taratasy ara-panjakana.",
      accessBtn: "Hiditra amin'ny sehatra",
      exploreBtn: "Hijery ny rafitra",
      coverageTitle: "Faritra iasan'ny rafitra",
      coverageSubtitle:
        "Mampifandray ireo sampan-draharaha ara-panjakana ao Fianarantsoa ny rafitra GED.",
      locationTitle: "Fianarantsoa",
      locationDesc: "Foiben'ny Faritra Haute Matsiatra",
      workflowTitle: "Fomba fiasan'ny rafitra GED",
      workflowSubtitle:
        "Dingana voalamina hanamora ny raharaham-panjakana sy hiarovana ireo arisiva.",
      step1Title: "Numérisation sy fanangonana",
      step1Desc:
        "Fandraisana sy fanovana ireo taratasy sy antontan-taratasy ho endrika nomerika.",
      step2Title: "Fanondroana sy méta-données",
      step2Desc:
        "Fampifandraisana ny IM, sokajy, karazana antontan-taratasy ary teny fanalahidy.",
      step3Title: "Fanaraha-maso sy traçabilité",
      step3Desc:
        "Fandraketana ireo asa rehetra ataon'ny mpampiasa nahazo alalana.",
      step4Title: "Fitahirizana azo antoka",
      step4Desc:
        "Fitahirizana voaaro sy misy sauvegarde ho fiarovana ny antontan-taratasy.",
      authTitle: "Fidiran'ny Mpandraharaha",
      authSubtitle: "Ampiasao ny laharana IM sy ny teny miafinao hidirana amin'ny tableau de bord.",
      labelIm: "Laharana IM",
      labelMdp: "Teny miafina",
      placeholderIm: "Ohatra: DAG001",
      placeholderMdp: "Ampidiro ny teny miafina",
      btnSubmit: "Hiditra",
      btnLoading: "Eo am-panamarinana...",
      secureAccess: "Fidirana azo antoka",
      authHint: "Ho an'ny mpandraharaha nahazo alalana ihany",
      footerRights: "© 2026 Faritra Haute Matsiatra. Zo rehetra voatana.",
      connectionError: "Tsy mety ny IM na ny teny miafina, na tsy mandeha ny serveur.",
      discover: "Hijery ny fomba fiasa",
    },
  };

  const currText = t[lang];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanIm = im.trim();

    if (!cleanIm || !mdp) {
      setError(
        lang === "fr"
          ? "Veuillez renseigner votre matricule et votre mot de passe."
          : "Ampidiro ny laharana IM sy ny teny miafinao."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(cleanIm, mdp);
      const userData = response?.user || response;
      const token = response?.access_token || response?.token || response?.im;

      localStorage.setItem("user", JSON.stringify(userData));
      if (token) {
        localStorage.setItem("token", token);
      }

      if (onLoginSuccess) {
        onLoginSuccess(userData);
      }
    } catch (err) {
      const apiMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "";

      setError(apiMessage || currText.connectionError);
    } finally {
      setLoading(false);
    }
  };

  const scrollToLogin = () => {
    document.getElementById("agent-login")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { margin: 0; }
        button, input { font: inherit; }

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

        .ged-lang-btn:hover {
          color: #085f63 !important;
        }

        .ged-feature-card:hover {
          transform: translateY(-4px);
          border-color: #b8d9d6 !important;
          box-shadow: 0 18px 40px rgba(15,42,48,.09) !important;
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

        @media (max-width: 980px) {
          .ged-header { padding: 14px 24px !important; }
          .ged-hero { grid-template-columns: 1fr !important; }
          .ged-hero-copy { max-width: 780px !important; }
          .ged-login-card { max-width: 560px !important; width: 100% !important; }
          .ged-coverage { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 680px) {
          .ged-header { padding: 12px 16px !important; }
          .ged-brand-subtitle { display: none !important; }
          .ged-nav-actions { gap: 8px !important; }
          .ged-login-label { display: none !important; }
          .ged-login-top-btn { padding: 10px 12px !important; }
          .ged-hero-section { padding: 42px 16px 30px !important; }
          .ged-hero-title { font-size: 38px !important; }
          .ged-hero-actions { flex-direction: column !important; align-items: stretch !important; }
          .ged-hero-actions button, .ged-hero-actions a { width: 100% !important; justify-content: center !important; }
          .ged-content-section { padding-left: 16px !important; padding-right: 16px !important; }
          .ged-login-card { padding: 24px !important; }
          .ged-workflow-grid { grid-template-columns: 1fr !important; }
          .ged-footer { padding: 20px 16px !important; }
        }
      `}</style>

      {/* ============================================================
          HEADER
      ============================================================ */}
      <header className="ged-header" style={styles.header}>
        <div style={styles.brandWrap}>
          <div style={styles.logoBox} aria-label="GED">
            <Icon name="folder" size={25} strokeWidth={2} />
          </div>

          <div>
            <div style={styles.brandTitle}>{currText.appName}</div>
            <div className="ged-brand-subtitle" style={styles.brandSubtitle}>
              {currText.districtName}
            </div>
          </div>
        </div>

        <div className="ged-nav-actions" style={styles.navActions}>
          <div style={styles.langGroup} aria-label="Choix de langue">
            <button
              type="button"
              className="ged-lang-btn"
              onClick={() => setLang("fr")}
              style={{
                ...styles.langButton,
                ...(lang === "fr" ? styles.langButtonActive : {}),
              }}
            >
              FR
            </button>
            <button
              type="button"
              className="ged-lang-btn"
              onClick={() => setLang("mg")}
              style={{
                ...styles.langButton,
                ...(lang === "mg" ? styles.langButtonActive : {}),
              }}
            >
              MG
            </button>
          </div>

          <button
            type="button"
            className="ged-nav-btn ged-login-top-btn"
            onClick={scrollToLogin}
            style={styles.headerLoginButton}
          >
            <Icon name="lock" size={17} />
            <span className="ged-login-label">{currText.loginBtn}</span>
          </button>
        </div>
      </header>

      <main>
        {/* ==========================================================
            HERO
        ========================================================== */}
        <section className="ged-hero-section" style={styles.heroSection}>
          <div className="ged-hero" style={styles.heroGrid}>
            <div className="ged-hero-copy" style={styles.heroCopy}>
              <div style={styles.eyebrow}>
                <span style={styles.eyebrowDot}></span>
                {currText.heroEyebrow}
              </div>

              <div style={styles.heroBadge}>{currText.appTagline}</div>

              <h1 className="ged-hero-title" style={styles.heroTitle}>
                {currText.heroTitle}
              </h1>

              <p style={styles.heroDescription}>{currText.heroDesc}</p>

              <div className="ged-hero-actions" style={styles.heroActions}>
                <button
                  type="button"
                  className="ged-primary-btn"
                  onClick={scrollToLogin}
                  style={styles.primaryButton}
                >
                  {currText.accessBtn}
                  <Icon name="arrowRight" size={18} />
                </button>

                <a
                  href="#workflow"
                  className="ged-secondary-btn"
                  style={styles.secondaryButton}
                >
                  {currText.exploreBtn}
                </a>
              </div>

              <div style={styles.heroMetaRow}>
                <div style={styles.metaItem}>
                  <div style={styles.metaIcon}>
                    <Icon name="shield" size={17} />
                  </div>
                  <div>
                    <strong style={styles.metaTitle}>{currText.secureAccess}</strong>
                    <span style={styles.metaText}>{currText.authHint}</span>
                  </div>
                </div>

                <div style={styles.metaDivider}></div>

                <div style={styles.metaItem}>
                  <div style={styles.metaIcon}>
                    <Icon name="database" size={17} />
                  </div>
                  <div>
                    <strong style={styles.metaTitle}>GED centralisée</strong>
                    <span style={styles.metaText}>Documents, archives et traçabilité</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------
                CARTE DE CONNEXION
            ------------------------------------------------------ */}
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
                  <h2 style={styles.authTitle}>{currText.authTitle}</h2>
                  <p style={styles.authSubtitle}>{currText.authSubtitle}</p>
                </div>
              </div>

              {error && (
                <div style={styles.errorBox} role="alert">
                  <div style={styles.errorIcon}>
                    <Icon name="x" size={16} />
                  </div>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={styles.fieldGroup}>
                  <label htmlFor="login-im" style={styles.fieldLabel}>
                    {currText.labelIm}
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
                      onChange={(e) => setIm(e.target.value)}
                      placeholder={currText.placeholderIm}
                      autoComplete="username"
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label htmlFor="login-password" style={styles.fieldLabel}>
                    {currText.labelMdp}
                  </label>

                  <div style={styles.inputWrap}>
                    <span style={styles.inputIcon}>
                      <Icon name="lock" size={19} />
                    </span>
                    <input
                      id="login-password"
                      className="ged-input"
                      type={showPassword ? "text" : "password"}
                      value={mdp}
                      onChange={(e) => setMdp(e.target.value)}
                      placeholder={currText.placeholderMdp}
                      autoComplete="current-password"
                      required
                      style={{ ...styles.input, paddingRight: "48px" }}
                    />
                    <button
                      type="button"
                      className="ged-eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      style={styles.eyeButton}
                    >
                      <Icon name={showPassword ? "eyeOff" : "eye" } size={19} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="ged-login-submit"
                  style={{
                    ...styles.submitButton,
                    ...(loading ? styles.submitButtonDisabled : {}),
                  }}
                >
                  {loading ? (
                    <>
                      <span style={styles.spinner}></span>
                      {currText.btnLoading}
                    </>
                  ) : (
                    <>
                      <span>{currText.btnSubmit}</span>
                      <Icon name="arrowRight" size={18} />
                    </>
                  )}
                </button>
              </form>

              <div style={styles.loginFooter}>
                <Icon name="shield" size={15} />
                <span>{currText.secureAccess}</span>
                <span style={styles.footerDot}>•</span>
                <span>{currText.authHint}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================================
            COUVERTURE TERRITORIALE
        ========================================================== */}
        <section className="ged-content-section" style={styles.contentSection}>
          <div className="ged-coverage" style={styles.coverageGrid}>
            <div>
              <div style={styles.sectionKicker}>
                <Icon name="map" size={18} />
                TERRITOIRE
              </div>
              <h2 style={styles.sectionTitle}>{currText.coverageTitle}</h2>
              <p style={styles.sectionSubtitle}>{currText.coverageSubtitle}</p>

              <div style={styles.locationCard}>
                <div style={styles.locationIcon}>
                  <Icon name="pin" size={22} />
                </div>
                <div>
                  <strong style={styles.locationTitle}>{currText.locationTitle}</strong>
                  <span style={styles.locationDesc}>{currText.locationDesc}</span>
                </div>
              </div>
            </div>

            <div style={styles.mapBox}>
              <iframe
                title="Carte Haute Matsiatra - Fianarantsoa"
                width="100%"
                height="350"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                allowFullScreen
                src="https://www.openstreetmap.org/export/embed.html?bbox=46.9000%2C-21.6000%2C47.3000%2C-21.3000&amp;layer=mapnik&amp;marker=-21.4536%2C47.0858"
              ></iframe>
            </div>
          </div>
        </section>

        {/* ==========================================================
            WORKFLOW
        ========================================================== */}
        <section
          id="workflow"
          className="ged-content-section"
          style={styles.workflowSection}
        >
          <div style={styles.sectionHeadingCenter}>
            <div style={{ ...styles.sectionKicker, justifyContent: "center" }}>
              <Icon name="folder" size={18} />
              PROCESSUS GED
            </div>
            <h2 style={styles.sectionTitle}>{currText.workflowTitle}</h2>
            <p style={{ ...styles.sectionSubtitle, maxWidth: "720px", margin: "0 auto" }}>
              {currText.workflowSubtitle}
            </p>
          </div>

          <div className="ged-workflow-grid" style={styles.workflowGrid}>
            <FeatureCard
              icon="file"
              number="01"
              title={currText.step1Title}
              description={currText.step1Desc}
            />
            <FeatureCard
              icon="tag"
              number="02"
              title={currText.step2Title}
              description={currText.step2Desc}
            />
            <FeatureCard
              icon="shield"
              number="03"
              title={currText.step3Title}
              description={currText.step3Desc}
            />
            <FeatureCard
              icon="database"
              number="04"
              title={currText.step4Title}
              description={currText.step4Desc}
            />
          </div>
        </section>
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer className="ged-footer" style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerBrand}>
            <div style={styles.footerLogo}>
              <Icon name="folder" size={18} />
            </div>
            <div>
              <strong style={styles.footerBrandTitle}>{currText.appName}</strong>
              <span style={styles.footerBrandSub}>{currText.districtName}</span>
            </div>
          </div>

          <div style={styles.footerCenter}>{currText.footerRights}</div>

          <div style={styles.footerRight}>
            <Icon name="globe" size={15} />
            <span>FR / MG</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, number, title, description }) {
  return (
    <div className="ged-feature-card" style={styles.featureCard}>
      <div style={styles.featureTop}>
        <div style={styles.featureIcon}>
          <Icon name={icon} size={22} />
        </div>
        <span style={styles.featureNumber}>{number}</span>
      </div>

      <h3 style={styles.featureTitle}>{title}</h3>
      <p style={styles.featureDescription}>{description}</p>

      <div style={styles.featureLine}>
        <span></span>
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
    background: "linear-gradient(145deg,#0c7e82,#085f63)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 9px 20px rgba(8,95,99,.18)",
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

  langGroup: {
    display: "inline-flex",
    padding: "4px",
    background: "#eff4f5",
    border: "1px solid #dce7e9",
    borderRadius: "13px",
  },

  langButton: {
    border: "none",
    background: "transparent",
    color: "#6a7c82",
    padding: "7px 11px",
    borderRadius: "9px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: ".08em",
    cursor: "pointer",
    transition: "all .2s ease",
  },

  langButtonActive: {
    background: "#fff",
    color: "#085f63",
    boxShadow: "0 2px 7px rgba(14,59,67,.08)",
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
    boxShadow: "0 7px 17px rgba(8,95,99,.14)",
  },

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
    boxShadow: "0 0 0 5px rgba(15,150,152,.1)",
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
    boxShadow: "0 10px 24px rgba(8,95,99,.2)",
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

  loginCard: {
    position: "relative",
    width: "100%",
    maxWidth: "490px",
    justifySelf: "end",
    background: "#fff",
    border: "1px solid #dbe7e9",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 30px 70px rgba(10,50,57,.13)",
  },

  loginCardTopLine: {
    position: "absolute",
    left: "30px",
    right: "30px",
    top: 0,
    height: "4px",
    borderRadius: "0 0 8px 8px",
    background: "linear-gradient(90deg,#085f63,#2b9ea0)",
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
    boxShadow: "0 10px 22px rgba(8,95,99,.17)",
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
    borderTopColor: "#fff",
    animation: "spin .8s linear infinite",
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
    background: "linear-gradient(135deg,#edf9f8,#f8fcfc)",
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
    boxShadow: "0 18px 50px rgba(14,59,67,.08)",
  },

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
    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
    gap: "18px",
  },

  featureCard: {
    position: "relative",
    minHeight: "235px",
    padding: "22px",
    background: "#fff",
    border: "1px solid #dce7e9",
    borderRadius: "17px",
    boxShadow: "0 10px 24px rgba(14,59,67,.035)",
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
    gridTemplateColumns: "1fr auto 1fr",
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
    background: "rgba(255,255,255,.1)",
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

import React, { useState } from 'react';
import axios from 'axios';

const AjouterUtilisateur = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    im: '',
    nom: '',
    prenom: '',
    mdp: '',
    type_user: 'DAG' // 'DAG', 'RH' ou 'RSI'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Appel API POST /api/v1/users/
      const response = await axios.post('/api/v1/users/', formData);
      if (onUserAdded) onUserAdded(response.data);
      onClose();
      // Réinitialisation du formulaire
      setFormData({ im: '', nom: '', prenom: '', mdp: '', type_user: 'DAG' });
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la création de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Nouveau utilisateur</h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label>IM :</label>
            <input
              type="text"
              name="im"
              value={formData.im}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Nom :</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Prénom :</label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Mot de passe :</label>
            <input
              type="password"
              name="mdp"
              value={formData.mdp}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label>Type d'utilisateur :</label>
            <select
              name="type_user"
              value={formData.type_user}
              onChange={handleChange}
              required
            >
              <option value="DAG">DAG</option>
              <option value="RH">RH</option>
              <option value="RSI">RSI</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AjouterUtilisateur;
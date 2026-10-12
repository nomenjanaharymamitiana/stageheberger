import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModifieUtilisateur = ({ isOpen, onClose, userToEdit, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    mdp: '',
    type_user: 'DAG'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pré-remplir les champs avec les données actuelles
  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nom: userToEdit.nom || '',
        prenom: userToEdit.prenom || '',
        mdp: '', // Laisser vide si inchangé
        type_user: userToEdit.type_user || 'DAG'
      });
    }
  }, [userToEdit]);

  if (!isOpen || !userToEdit) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Préparer le payload en omettant le mdp s'il est vide
      const payload = { ...formData };
      if (!payload.mdp) delete payload.mdp;

      // Appel API PUT /api/v1/users/{im}
      const response = await axios.put(`/api/v1/users/${userToEdit.im}`, payload);
      if (onUserUpdated) onUserUpdated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la modification de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Modifier utilisateur (IM: {userToEdit.im})</h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleSubmit}>
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
            <label>Mot de passe (laisser vide pour ne pas modifier) :</label>
            <input
              type="password"
              name="mdp"
              value={formData.mdp}
              onChange={handleChange}
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
              {loading ? 'Enregistrement...' : 'Enregistrer'}
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

export default ModifieUtilisateur;
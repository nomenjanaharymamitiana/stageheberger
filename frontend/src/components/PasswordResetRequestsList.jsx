import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, KeyRound } from 'lucide-react';
import NotificationBadge from './NotificationBadge';

const PasswordResetRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fonction pour récupérer les demandes de réinitialisation depuis l'API
  const fetchPasswordResetRequests = async () => {
    setLoading(true);
    try {
      // Remplacez '/api/password-reset-requests' par l'endpoint réel de votre backend FastAPI/Express
      const response = await fetch('/api/password-reset-requests');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des demandes');
      }
      const data = await response.json();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Exemple de données fictives en cas d'erreur/test
      setRequests([
        { id: 1, user: 'John Doe', email: 'john@example.com', date: '2026-09-30 08:30', status: 'pending' },
        { id: 2, user: 'Alice Smith', email: 'alice@example.com', date: '2026-09-30 09:15', status: 'pending' },
        { id: 3, user: 'Bob Martin', email: 'bob@example.com', date: '2026-09-29 14:20', status: 'processed' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasswordResetRequests();
  }, []);

  // Calcul du nombre de demandes en attente
  const pendingCount = requests.filter(req => req.status === 'pending').length;

  // Traiter la demande (Approuver ou Rejeter)
  const handleAction = async (id, action) => {
    try {
      // Appel API pour mettre à jour le statut
      await fetch(`/api/password-reset-requests/${id}/${action}`, { method: 'POST' });

      // Mise à jour locale du statut
      setRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' } : req))
      );
    } catch (err) {
      console.error(`Erreur lors de l'action ${action}:`, err);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Barre d'outils / En-tête avec Icône de Notification */}
      <div className="flex items-center space-x-3 p-2 bg-gray-100 rounded-lg shadow-sm">
        <NotificationBadge 
          count={pendingCount} 
          onClick={() => setShowDropdown(!showDropdown)} 
        />
        <span className="font-medium text-gray-700 text-sm">
          Demandes de réinitialisation
        </span>
      </div>

      {/* Menu / Panneau déroulant des demandes */}
      {showDropdown && (
        <div className="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 divide-y divide-gray-100">
          {/* Header du panneau */}
          <div className="p-3 flex justify-between items-center bg-gray-50 rounded-t-md">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800 text-sm">
                Demandes ({pendingCount} en attente)
              </span>
            </div>
            <button
              onClick={fetchPasswordResetRequests}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Liste des demandes */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">Chargement...</div>
            ) : requests.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">Aucune demande trouvée.</div>
            ) : (
              requests.map((req) => (
                <div key={req.id} className="p-3 hover:bg-gray-50 transition flex justify-between items-start border-b last:border-none">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.user}</p>
                    <p className="text-xs text-gray-500">{req.email}</p>
                    <span className="text-[10px] text-gray-400">{req.date}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleAction(req.id, 'approve')}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Valider la réinitialisation"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'reject')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Refuser"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        req.status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status === 'approved' ? 'Validé' : 'Refusé'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequestsList;
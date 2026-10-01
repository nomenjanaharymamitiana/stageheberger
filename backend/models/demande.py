from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from database import Base


class DemandeChangementMdp(Base):
    __tablename__ = "demandes_changement_mdp"

    # ============================================================
    # IDENTIFIANT DE LA DEMANDE
    # ============================================================

    id_dmd = Column(
        String(50),
        primary_key=True,
        index=True
    )

    # ============================================================
    # UTILISATEUR
    # ============================================================

    im_user = Column(
        String(50),
        ForeignKey(
            "utilisateur.im",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # ============================================================
    # NOUVEAU MOT DE PASSE
    # ============================================================

    # On ne stocke JAMAIS le mot de passe en clair.
    # Il est déjà hashé avant d'arriver ici.
    new_password_hash = Column(
        String(255),
        nullable=False
    )

    # ============================================================
    # DATE
    # ============================================================

    date_demande = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # ============================================================
    # STATUT
    # ============================================================

    statut = Column(
        String(20),
        default="en_attente",
        nullable=False
    )

    # ============================================================
    # RELATION UTILISATEUR
    # ============================================================

    demandeur = relationship(
        "Utilisateur",
        back_populates="demandes_mdp"
    )
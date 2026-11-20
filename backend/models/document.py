from sqlalchemy import Column, String, Date, DateTime, ForeignKey, LargeBinary, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Document(Base):
    __tablename__ = "documents"

    num_ref = Column(String(100), primary_key=True, index=True)
    date_num = Column(Date, nullable=False)
    format = Column(String(20), nullable=False)
    cat = Column(String(100), nullable=False)
    annee_redac = Column(String(4), nullable=False)

    title = Column(String(255), nullable=False, default="Sans titre")
    file_path = Column(String(500), nullable=True)

    # Date de suppression pour la corbeille (NULL = actif, DATETIME = en corbeille)
    date_suppression = Column(DateTime, nullable=True, default=None)

    # Clé étrangère pointant directement sur la table utilisateur
    im_dag_rh = Column(String(50), ForeignKey("utilisateur.im"), nullable=True)
    
    # Fichier stocké directement dans PostgreSQL
    file_data = Column(LargeBinary, nullable=True)

    # Empreinte SHA-256 du contenu du fichier
    file_hash = Column(String(64), nullable=True, index=True)

    # Nouveau : Indicateur pour marquer un document comme important ou favori
    est_important = Column(Boolean, nullable=False, default=False)

    # Relations
    dag_rh_rel = relationship("Utilisateur", back_populates="documents")
    journals = relationship("Journal", back_populates="document")
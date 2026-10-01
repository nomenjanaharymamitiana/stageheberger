from sqlalchemy import Column, String, Date, DateTime, ForeignKey
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
    file_path = Column(String(500), nullable=False)

    # Date de suppression pour la corbeille (NULL = actif, DATETIME = en corbeille)
    date_suppression = Column(DateTime, nullable=True, default=None)

    # Clé étrangère pointant directement sur la table utilisateur
    im_dag_rh = Column(String(50), ForeignKey("utilisateur.im"), nullable=True)
    
    # Relations
    dag_rh_rel = relationship("Utilisateur", back_populates="documents")
    journals = relationship("Journal", back_populates="document")
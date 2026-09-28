from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, get_db

app = FastAPI()

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Exécute une requête SQL minimale
        result = db.execute(text("SELECT 1")).scalar()
        return {"status": "success", "db_response": result}
    except Exception as e:
        # Retourne l'erreur exacte capturée
        return {"status": "error", "message": str(e)}
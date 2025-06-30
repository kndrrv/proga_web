from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException
from typing import List
import mysql.connector


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TaskLog(BaseModel):
    email: str
    task: str
    subtask: str
    started_at: str = None
    end_at: str = None
    comentario: str = None

def conectar_db():
    return mysql.connector.connect(
        host="localhost",
        port=3306,
        user="root",
        password="051200",
        database="manufacturing_logs"
    )

@app.post("/guardar-tareas")
def guardar_tareas(tareas: List[TaskLog]):
    print("¡Llegó una petición!")
    db = conectar_db()
    cursor = db.cursor()
    
    try:
        for tarea in tareas:
            sql = """
            INSERT INTO tech_logs (email, task, subtask, started_at, end_at, comentario)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            valores = (
                tarea.email,
                tarea.task,
                tarea.subtask,
                tarea.started_at,
                tarea.end_at,
                tarea.comentario
            )
            cursor.execute(sql, valores)
        
        db.commit()
        return {"mensaje": f"{len(tareas)} tareas guardadas con éxito"}
    

    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    
    finally:
        cursor.close()
        db.close()

#Consultar tareas

@app.get("/consultar-tareas")  
async def consultar_tareas(email: str):
    db = conectar_db()
    cursor = db.cursor(dictionary=True)
    
    try:
        cursor.execute(
            "SELECT * FROM tech_logs WHERE email = %s ORDER BY started_at DESC",
            (email,)
        )
        resultados = cursor.fetchall()
        
        if not resultados:
            return JSONResponse(
                status_code=404,
                content={"message": "No se encontraron tareas"}
            )
        
        return {"tareas": resultados}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", reload=True, port=8000)

@app.delete("/eliminar-tarea/{tarea_id}")
async def eliminar_tarea(tarea_id: int):
    db = conectar_db()
    cursor = db.cursor()
    
    try:
        # Verificar si la tarea existe primero
        cursor.execute("SELECT id FROM tech_logs WHERE id = %s", (tarea_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Tarea no encontrada")
        
        # Eliminar la tarea
        cursor.execute("DELETE FROM tech_logs WHERE id = %s", (tarea_id,))
        db.commit()
        
        return {"mensaje": "Tarea eliminada correctamente"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()

@app.delete("/eliminar-todas-tareas")
async def eliminar_todas_tareas(email: str):
    db = conectar_db()
    cursor = db.cursor()
    
    try:
        # Primero contamos las tareas a eliminar (para el mensaje de respuesta)
        cursor.execute("SELECT COUNT(*) FROM tech_logs WHERE email = %s", (email,))
        count = cursor.fetchone()[0]
        
        if count == 0:
            return JSONResponse(
                status_code=404,
                content={"message": f"No se encontraron tareas para el email {email}"}
            )
        
        # Eliminamos las tareas
        cursor.execute("DELETE FROM tech_logs WHERE email = %s", (email,))
        db.commit()
        
        return {"mensaje": f"Se eliminaron {count} tareas correctamente", "eliminadas": count}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        db.close()
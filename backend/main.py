from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "CasaConnect API is Online"}

@app.get("/data")
def get_data():
    return {"items": ["House A", "House B", "House C"]}
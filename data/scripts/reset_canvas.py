from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String
from sqlalchemy.orm import sessionmaker
from random import randint
import os
from dotenv import load_dotenv
import requests

load_dotenv()

color = 0xFFFFFF

pg_user = os.getenv("PG_USER")
pg_password = os.getenv("PG_PASSWORD")
pg_host = os.getenv("PG_HOST")

DATABASE_URI = f'postgresql://{pg_user}:{pg_password}@{pg_host}/roskildepixels'

engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

metadata = MetaData()

# Autoloading was removed because it required the table to be already loaded
canvas = Table('canvas', metadata, 
    Column('id', Integer, primary_key=True),
    Column('color', Integer, nullable=False)
)

metadata.create_all(engine) # Ensures table creation if not existing yet

session.query(canvas).update({canvas.c.color: color})
session.commit()

session.close()

# Send a request to the frontend to reset the canvas
# requests.get("http://localhost:5000/trigger")
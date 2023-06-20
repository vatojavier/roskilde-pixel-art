from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String
from sqlalchemy.orm import sessionmaker
from random import randint
from dotenv import load_dotenv
import os

load_dotenv()

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

for i in range(80_000):
    # Generate random tile and color, in hex and convert to int
    color = 0xE5E8E8
    
    # Insert into the database
    query = canvas.insert().values(id=i, color=color)
    session.execute(query)

# commit the transaction
session.commit()
session.close()
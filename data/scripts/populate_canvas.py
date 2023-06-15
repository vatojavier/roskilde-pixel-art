from sqlalchemy import create_engine, Table, MetaData, Column, Integer, String
from sqlalchemy.orm import sessionmaker
from random import randint

# Replace these with your actual credentials
DATABASE_URI = 'postgresql://python:python1234@localhost/roskildepixels'

engine = create_engine(DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

metadata = MetaData()

# Autoloading was removed because it required the table to be already loaded
canvas = Table('canvas', metadata, 
    Column('id', Integer, primary_key=True),
    Column('tile', Integer, nullable=False),
    Column('color', String(7), nullable=False)
)

metadata.create_all(engine) # Ensures table creation if not existing yet

for i in range(20000):
    # Generate random tile and color
    # tile = randint(0, 1000000) # Change this range depending on the size of your canvas
    color = '#%06X' % randint(0, 0xFFFFFF)
    
    # Insert into the database
    query = canvas.insert().values(id=i, tile=i, color=color)
    session.execute(query)

# commit the transaction
session.commit()

from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    user_id = Column(UUID(as_uuid=True), primary_key=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.datetime.utcnow)
    pixels_left = Column(Integer)
    reset_pixel_placed_at = Column(DateTime)

class CanvasHistory(Base):
    __tablename__ = 'canvas_history'

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True))
    tile_id = Column(Integer)
    color = Column(Integer)
    placed_at = Column(DateTime, default=datetime.datetime.utcnow)
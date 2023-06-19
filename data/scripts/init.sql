CREATE DATABASE roskildepixels;

CREATE USER python WITH PASSWORD 'python1234';

\c roskildepixels;

GRANT ALL PRIVILEGES ON DATABASE roskildepixels TO python;
GRANT ALL PRIVILEGES ON SCHEMA public TO python;

-- Tables that are created by the application
SET ROLE python;

CREATE TABLE users (
    user_id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pixels_left INT NOT NULL,
    last_pixel_placed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE canvas (
  id SERIAL PRIMARY KEY,
  color INT
);

CREATE TABLE canvas_history (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id),
    tile_id INT NOT NULL REFERENCES canvas(id),
    color INT NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
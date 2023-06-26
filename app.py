from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    make_response,
    session as flask_session,
)
from flask_socketio import SocketIO, emit
import time
import uuid
from sqlalchemy import create_engine, update, MetaData
from sqlalchemy.orm import sessionmaker
from models import User, CanvasHistory
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
import pandas as pd
import numpy as np
from dotenv import load_dotenv
import os

load_dotenv()
pg_user = os.getenv("PG_USER")
pg_password = os.getenv("PG_PASSWORD")
pg_host = os.getenv("PG_HOST")

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})
app.config["SECRET_KEY"] = "secret"
socketio = SocketIO(app, cors_allowed_origins="*")

engine = create_engine(f"postgresql://{pg_user}:{pg_password}@{pg_host}/roskildepixels")
Session = sessionmaker(bind=engine)
session = Session()

metadata = MetaData()
metadata.reflect(bind=engine)

# Get your canvas tables
canvas_table = metadata.tables["canvas"]
canvas_history_table = metadata.tables["canvas_history"]

canvas_array: np.ndarray  # Global variable to store the canvas, it should be in sync with the database table 'canvas'
n_tiles = 45_000  # Number of tiles available for the users, DB has up to 80_000 tiles

max_pixels_per_user = int(os.getenv("MAX_PIXELS_PER_USER"))
max_cool_down_minutes = int(os.getenv("COOLDOWN_MINUTES"))


def load_canvas_from_db():
    global canvas_array

    query = f"""
    SELECT color FROM canvas where id < {n_tiles} order by id asc
    """

    with engine.connect() as con:
        df = pd.read_sql_query(query, con)
    canvas_array = df["color"].to_numpy()

    print(f"Sending {len(canvas_array)} tiles to the frontend")

    session.close()


load_canvas_from_db()


@app.route("/api/get_canvas")
def get_canvas():
    # Convert number to hexadeciaml color code with the leading #
    data = [f"#{hex(color)[2:].zfill(6)}" for color in canvas_array]

    return jsonify(data)


@app.route("/api/delete_pixels", methods=["GET", "POST"])
def delete_pixels():
    # Convert number to hexadeciaml color code with the leading #
    parameters = request.get_json()
    if (
        "pixel_ids" in parameters and "password" in parameters
    ):  # maybe a validation function here
        pixel_ids = parameters["pixel_ids"]
        password = parameters["password"]
        if password == "correct":
            try:
                # delete here
                message, status = "OK", 200
                # emit draw for deleted pixel ids with a white pixel maybe?
                # [emit("draw", pixel_id, broadcast=True) for pixel_id in pixel_ids]
            except Exception as error:
                message, status = error, 500
        else:
            message, status = "Unauthorized", 401
    else:
        message, status = "Bad Request", 400

    return jsonify({"message": message}), status


@app.route("/api/get_cookie")
def get_cookie():
    user_id = request.cookies.get("user_id")
    session = Session()

    if not user_id:
        user_id = str(uuid.uuid4())
        print("New user, setting cookie")

        new_user = User(user_id=user_id, pixels_left=max_pixels_per_user)
        session.add(new_user)

        # Set a cookie that expires in 1 month
        expires = int(time.time()) + 60 * 60 * 24 * 30

        response = make_response({"user_id": user_id, "is_first_time_user": True})
        response.set_cookie(
            "user_id",
            user_id,
            expires=expires,
            secure=True,
            httponly=True,  # samesite="None"
        )
        session.commit()
        session.close()

        return response
    else:
        cookie = request.cookies.get("user_id")
        print(f"Returning user with cookie: {cookie}")

        # Update User's last_seen_at
        user = session.query(User).filter_by(user_id=user_id).first()

        # if for some reason the user doesn't exist, create a new one
        if not user:
            new_user = User(user_id=user_id, pixels_left=max_pixels_per_user)
            session.add(new_user)
        else:
            user.last_seen_at = datetime.utcnow()

    # Commit changes and close the session
    session.commit()
    session.close()

    return jsonify({"user_id": user_id, "is_first_time_user": False})


@app.route("/api/get_canvas_size")
def get_msg():
    print("Getting canvas size")
    n_tiles_x = int(os.environ.get("N_TILES_X"))
    n_tiles_y = int(os.environ.get("N_TILES_Y"))

    canvas_width = int(os.environ.get("CANVAS_WIDTH"))
    canvas_height = int(os.environ.get("CANVAS_HEIGHT"))

    data = {
        "n_tiles_x": n_tiles_x,
        "n_tiles_y": n_tiles_y,
        "canvas_width": canvas_width,
        "canvas_height": canvas_height,
    }

    # data = {"message": "Hello from the backend!"}
    return jsonify(data)


@app.route("/api/get_pixels_left")
def get_user_pixels():
    user_id = request.cookies.get("user_id")
    session = Session()

    pixels_left = session.query(User).filter_by(user_id=user_id).first().pixels_left

    session.close()

    return jsonify({"pixels_left": pixels_left})


@app.route("/api/get_max_pixels_per_user")
def get_max_pixels_per_user():
    return jsonify({"max_pixels_per_user": max_pixels_per_user})


@app.route("/api/get_max_cool_down_time")
def get_max_cool_down_time():
    return jsonify({"max_cool_down_seconds": max_cool_down_minutes * 60})


@app.route("/api/get_cool_down_time_left")
def get_cool_down_time_left():
    user_id = request.cookies.get("user_id")
    session = Session()

    reset_at = (
        session.query(User).filter_by(user_id=user_id).first().reset_pixel_placed_at
    )

    # set reset_at to utc
    # breakpoint()

    # Set now to utc
    now = datetime.utcnow()
    
    # set tzinfo to utc
    now = now.replace(tzinfo=timezone.utc)

    print(f"Reset at: {reset_at}")
    print(f"Now: {now}")

    if not reset_at:
        cool_down_time_left = None
    else:
        # breakpoint()
        passed_seconds = (now - reset_at).total_seconds()
        cool_down_time_left = max_cool_down_minutes * 60 - passed_seconds
        print(f"Passed seconds: {passed_seconds}")
        print(f"Cool down time left: {cool_down_time_left}")

    session.close()

    return jsonify({"cool_down_time_left": cool_down_time_left})




@app.route("/")
def index():
    return render_template("index.html")


@app.route("/trigger")
def trigger():
    load_canvas_from_db()

    # Trigger a canvas update
    socketio.emit("update", {"data": "Update triggered!"})
    return "Triggered!"


# @socketio.on("connect")
# def handle_connect():
#     # print("User connected")
#     cookie = request.cookies.get("user_id")
#     flask_session["user_id"] = cookie
#     print(f"User connected with cookie: {cookie}")


@socketio.on("message")
def handle_message(message):
    print("Message received:", message)
    emit("response", {"data": "Message received: " + message}, broadcast=True)


@socketio.on("draw")
def handle_draw(data):
    now = datetime.utcnow()
    now = now.replace(tzinfo=timezone.utc)

    user_id = data["userID"]

    color_int = int(data["color"][1:], 16)
    previous_color = canvas_array[data["pixelID"]]
   

    session = Session()

    user = session.query(User).filter_by(user_id=user_id).first()
    if not user:
        print("User not found")
        session.close()
        return
    
    # breakpoint()
    # Check if user has pixels left
    if user.pixels_left <= 0:
        print("User has no pixels left")
        session.close()
        return

    user.pixels_left -= 1
    pixels_left = user.pixels_left
    canvas_array[data["pixelID"]] = color_int
    print(f"User {user_id} has {pixels_left} pixels left")

    # Setting cooldown time
    reset_pixel_at = user.reset_pixel_placed_at
    if reset_pixel_at is None:
        user.reset_pixel_placed_at = now
        reset_pixel_at = user.reset_pixel_placed_at
    else:
        # breakpoint()
        if now - reset_pixel_at > timedelta(minutes=max_cool_down_minutes):
            user.reset_pixel_placed_at = now
            reset_pixel_at = user.reset_pixel_placed_at
            # print("Resetting cooldown time")

    try:
        session.execute(
            update(canvas_table)
            .where(canvas_table.c.id == data["pixelID"])
            .values(color=color_int)
        )

        # add row to canvas_history
        new_history = CanvasHistory(
            user_id=user_id,
            tile_id=data["pixelID"],
            color=color_int,
        )
        session.add(new_history)

        session.commit()
    except Exception as e:
        print(e)
        session.rollback()
        canvas_array[data["pixelID"]] = previous_color
        # Maybe emit the original color back to the user and error message?
    finally:
        session.close()

    emit("draw", data, broadcast=True)


if __name__ == "__main__":
    # Run app for everyone on the network
    debug = False

    if os.environ.get("FLASK_ENV") == "dev":
        print("Running in dev mode")
        debug = True

    socketio.run(app, debug=debug)

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import time
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
app.config["SECRET_KEY"] = "secret"
socketio = SocketIO(app, cors_allowed_origins="*")

grid_size = 10


engine = create_engine("postgresql://python:python1234@localhost/roskildepixels")
Session = sessionmaker(bind=engine)
session = Session()

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/canvas")
def canvas():

    user_id = request.cookies.get("user_id")

    if not user_id:
        # This is a new user, let's set a cookie
        user_id = str(uuid.uuid4())
        print("New user, setting cookie")

        new_user = User(user_id=user_id, pixels_left=10)  # Set your default pixel count here
        session.add(new_user)

        # Set a cookie that expires in 1 year
        expires = int(time.time()) + 60 * 60 * 24 * 365
        response = app.make_response(
            render_template("canvas.html", grid_size=grid_size)
        )
        response.set_cookie("user_id", user_id, expires=expires)
    else:
        # This user has visited before
        cookie = request.cookies.get("user_id")
        print(f"Returning user with cookie: {cookie}")

        # Update User's last_seen_at
        user = session.query(User).filter_by(user_id=user_id).first()

        # if for some reason the user doesn't exist, create a new one
        if not user:
            new_user = User(user_id=user_id, pixels_left=10)
            session.add(new_user)
        else:
            user.last_seen_at = datetime.utcnow()

        response = render_template("canvas.html", grid_size=grid_size)

    # Commit changes and close the session
    session.commit()
    session.close()

    return response


@socketio.on("connect")
def handle_connect():
    print("User connected")


@socketio.on("message")
def handle_message(message):
    print("Message received:", message)
    emit("response", {"data": "Message received: " + message}, broadcast=True)


@socketio.on("draw")
def handle_draw(data):
    print(data)
    emit("draw", data, broadcast=True, include_self=False)


if __name__ == "__main__":
    socketio.run(app)

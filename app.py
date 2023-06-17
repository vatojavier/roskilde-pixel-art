from flask import Flask, render_template, request, jsonify, make_response
from flask_socketio import SocketIO, emit
import time
import uuid
from sqlalchemy import create_engine, update, MetaData
from sqlalchemy.orm import sessionmaker
from models import User
from datetime import datetime
from flask_cors import CORS
import pandas as pd


app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*", "supports_credentials": True}})
app.config["SECRET_KEY"] = "secret"
socketio = SocketIO(app, cors_allowed_origins="*")


grid_size = 50

engine = create_engine("postgresql://python:python1234@localhost/roskildepixels")
Session = sessionmaker(bind=engine)
session = Session()

# Assuming you've already defined your engine
metadata = MetaData()
metadata.reflect(bind=engine)

# Get your canvas table
canvas_table = metadata.tables['canvas']



@app.route("/api/get_canvas")
def get_canvas():
    with engine.connect() as con:
        df = pd.read_sql_query("SELECT color FROM canvas", con)
    print(df.head())

    # breakpoint()

    # Send data to angular frontend
    data = df["color"].tolist()

    return jsonify(data)
    
@app.route("/api/get_cookie")
def get_cookie():
    
    user_id = request.cookies.get("user_id")

    if not user_id:

        user_id = str(uuid.uuid4())
        print("New user, setting cookie")

        new_user = User(user_id=user_id, pixels_left=10)  # Set your default pixel count here
        session.add(new_user)

        # Set a cookie that expires in 1 month
        expires = int(time.time()) + 60 * 60 * 24 * 30

        response = make_response({"message": "Cookie set"})
        response.set_cookie("user_id", user_id, expires=expires, secure=True, httponly=True)
        return response
    else:
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
    
    # Commit changes and close the session
    session.commit()
    session.close()

    # print(f"Returning user with cookie: {user_id}"
    return jsonify({"message": "Cookie already set"})




@app.route("/")
def index():
    return render_template("index.html")



@app.route("/api/get_msg")
def get_msg():
    # with engine.connect() as con:
    #     df = pd.read_sql_query("SELECT * FROM canvas", con)
    # return jsonify(df.to_dict(orient="records"))
    data = {'message': 'Hello from the backend!'}
    return jsonify(data)



@app.route("/canvas")
def canvas():

    user_id = request.cookies.get("user_id")

    
    # measure time it takes to query the database
    start = time.time()
    with engine.connect() as con:
        df = pd.read_sql_query("SELECT * FROM canvas", con)
    end = time.time()

    print(f"Query took {end - start} seconds")
    print(df.head())

    if not user_id:
        # This is a new user, let's set a cookie
        user_id = str(uuid.uuid4())
        print("New user, setting cookie")

        new_user = User(user_id=user_id, pixels_left=10)  # Set your default pixel count here
        session.add(new_user)

        # Set a cookie that expires in 1 year
        expires = int(time.time()) + 60 * 60 * 24 * 365
        response = app.make_response(
            render_template("canvas2.html", grid_size=grid_size)
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

        response = render_template("canvas2.html", grid_size=grid_size)

    # Commit changes and close the session
    session.commit()
    session.close()

    return response


# @socketio.on("connect")
# def handle_connect():
#     print("User connected")


@socketio.on("message")
def handle_message(message):
    print("Message received:", message)
    emit("response", {"data": "Message received: " + message}, broadcast=True)


@socketio.on("draw")
def handle_draw(data):
    print("Draw event received:", data)
    # print(type(data))
    print(data["pixelID"], data["color"])

    # Insert data into database
    with engine.connect() as con:
        update_stmt = update(canvas_table).where(canvas_table.c.id == data['pixelID']).values(color=data['color'])
        con.execute(update_stmt)

    emit("draw", data, broadcast=True)


if __name__ == "__main__":

    # Run app for everyone on the network

    socketio.run(app, debug=False)

from flask import Flask, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/canvas')
def canvas():
    return render_template('canvas.html')

@socketio.on('connect')
def handle_connect():
    print('User connected')

@socketio.on('message')
def handle_message(message):
    print('Message received:', message)
    emit('response', {'data': 'Message received: ' + message}, broadcast=True)

@socketio.on("draw")
def handle_draw(data):
    print(data)
    emit("draw", data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app)
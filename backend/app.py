from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","))

    from routes.auth import auth_bp
    from routes.lecture import lecture_bp
    from routes.tasks import tasks_bp
    from routes.summary import summary_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(lecture_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(summary_bp)

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV", "production") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)

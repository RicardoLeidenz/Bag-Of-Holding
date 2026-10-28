"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix
from api.utils import APIException, generate_sitemap, limiter
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_jwt_extended import JWTManager

# from models import Person

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')
app = Flask(__name__)
app.url_map.strict_slashes = False
app.secret_key = os.getenv("FLASK_APP_KEY", "dev-only-insecure-key")

# In production the app runs behind the host's proxy; trust its X-Forwarded-For header
# so rate limiting sees each visitor's real IP instead of the proxy's
if ENV == "production":
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

# JWT configuration: tokens are signed with JWT_SECRET_KEY, which must never be committed
jwt_secret = os.getenv("JWT_SECRET_KEY")
if not jwt_secret:
    if ENV == "production":
        raise RuntimeError("JWT_SECRET_KEY environment variable is required in production")
    jwt_secret = "dev-only-insecure-jwt-key"
    print("WARNING: JWT_SECRET_KEY not set, using an insecure development key")
app.config["JWT_SECRET_KEY"] = jwt_secret
jwt = JWTManager(app)


# Return token problems as 401 JSON errors, so the frontend can treat them all as "logged out"
@jwt.unauthorized_loader
def missing_token(reason):
    return jsonify({"error": "Login required"}), 401


@jwt.invalid_token_loader
def invalid_token(reason):
    return jsonify({"error": "Invalid login token"}), 401


@jwt.expired_token_loader
def expired_token(jwt_header, jwt_payload):
    return jsonify({"error": "Login expired, please log in again"}), 401

# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# The admin panel can edit the whole database, so it only exists in development
if ENV == "development":
    setup_admin(app)

# add the CLI commands
setup_commands(app)

limiter.init_app(app)

# Add all endpoints form the API with a "api" prefix
app.register_blueprint(api, url_prefix='/api')

# Handle/serialize errors like a JSON object


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


@app.errorhandler(HTTPException)
def handle_http_error(error):
    # API clients get JSON errors (404, 405, 429...); everything else keeps Flask's default page
    if request.path.startswith("/api/"):
        return jsonify({"error": error.description}), error.code
    return error


@app.errorhandler(500)
def handle_server_error(error):
    return jsonify({"error": "Something went wrong on the server"}), 500

# generate sitemap with all your endpoints


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

# any other endpoint will try to serve it like a static file
@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    # Unknown API paths are real 404s, not the React app
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)

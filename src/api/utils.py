import re
from flask import jsonify, url_for, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Rate limiter shared by the app and the routes. Counts are kept in memory,
# which is fine for a single server process.
limiter = Limiter(get_remote_address, storage_uri="memory://")

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class APIException(Exception):
    status_code = 400

    def __init__(self, message, status_code=None, payload=None):
        Exception.__init__(self)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['error'] = self.message
        return rv


###### REQUEST VALIDATION ######
# Each helper raises APIException (returned to the client as a 400 JSON error)
# when the value is missing or invalid, so routes can read fields in one line.

def get_json_body():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        raise APIException("Request body must be a JSON object")
    return body


def require_string(body, field, max_length, min_length=1, required=True):
    if field not in body:
        if required:
            raise APIException(f"'{field}' is required")
        return None
    value = body[field]
    if not isinstance(value, str):
        raise APIException(f"'{field}' must be text")
    value = value.strip()
    if len(value) < min_length:
        raise APIException(f"'{field}' must be at least {min_length} characters")
    if len(value) > max_length:
        raise APIException(f"'{field}' must be at most {max_length} characters")
    return value


def require_int(body, field, minimum, maximum, required=True):
    if field not in body:
        if required:
            raise APIException(f"'{field}' is required")
        return None
    value = body[field]
    # bool is a subclass of int in Python, so reject it explicitly
    if not isinstance(value, int) or isinstance(value, bool):
        raise APIException(f"'{field}' must be a whole number")
    if value < minimum or value > maximum:
        raise APIException(f"'{field}' must be between {minimum} and {maximum}")
    return value


def require_bool(body, field, required=True):
    if field not in body:
        if required:
            raise APIException(f"'{field}' is required")
        return None
    value = body[field]
    if not isinstance(value, bool):
        raise APIException(f"'{field}' must be true or false")
    return value


def require_email(body, field="email"):
    value = require_string(body, field, max_length=120).lower()
    if not EMAIL_PATTERN.match(value):
        raise APIException(f"'{field}' must be a valid email address")
    return value

def has_no_empty_params(rule):
    defaults = rule.defaults if rule.defaults is not None else ()
    arguments = rule.arguments if rule.arguments is not None else ()
    return len(defaults) >= len(arguments)

def generate_sitemap(app):
    links = ['/admin/']
    for rule in app.url_map.iter_rules():
        # Filter out rules we can't navigate to in a browser
        # and rules that require parameters
        if "GET" in rule.methods and has_no_empty_params(rule):
            url = url_for(rule.endpoint, **(rule.defaults or {}))
            if "/admin/" not in url:
                links.append(url)

    links_html = "".join(["<li><a href='" + y + "'>" + y + "</a></li>" for y in links])
    return """
        <div style="text-align: center;">
        <img style="max-height: 80px" src='https://storage.googleapis.com/breathecode/boilerplates/rigo-baby.jpeg' />
        <h1>Rigo welcomes you to your API!!</h1>
        <p>API HOST: <script>document.write('<input style="padding: 5px; width: 300px" type="text" value="'+window.location.href+'" />');</script></p>
        <p>Start working on your project by following the <a href="https://start.4geeksacademy.com/starters/full-stack" target="_blank">Quick Start</a></p>
        <p>Remember to specify a real endpoint path like: </p>
        <ul style="text-align: left;">"""+links_html+"</ul></div>"

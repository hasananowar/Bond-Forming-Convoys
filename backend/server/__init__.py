import os
from flask import Flask
from server.extensions import db, jwt, cors
from flasgger import Swagger

def create_app(script_info=None):

    # instantiate the app
    app = Flask(__name__)
    swagger = Swagger(app)

    # set config
    app_settings = os.getenv("APP_SETTINGS")
    app.config.from_object(app_settings)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://convoy:password@host.docker.internal:3306/convoy'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'secret_key'  # Change this to a secure random key in production
    app.config['JWT_SECRET_KEY'] = 'secret_key'
    app.config['JWT_REQUIRED_CLAIMS'] = 'access'

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    with app.app_context():
        db.Model.metadata.reflect(db.engine)
        db.create_all()

    # register blueprints
    from .routes.main import main
    app.register_blueprint(main)

    # shell context for flask cli
    app.shell_context_processor({"app": app})

    return app
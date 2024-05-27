from flask.cli import FlaskGroup

from server import create_app
from server.extensions import db

app = create_app()

cli = FlaskGroup(create_app=create_app)

if __name__ == "__main__":
    cli()
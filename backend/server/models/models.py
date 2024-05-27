from server.extensions import db

class Company(db.Model):
    __table__ = db.Model.metadata.tables['companies']

class UserRole(db.Model):
    __table__ = db.Model.metadata.tables['user_roles']

class User(db.Model):
    __table__ = db.Model.metadata.tables['users']

class Job(db.Model):
    __table__ = db.Model.metadata.tables['jobs']

class Dataset(db.Model):
    __table__ = db.Model.metadata.tables['datasets']
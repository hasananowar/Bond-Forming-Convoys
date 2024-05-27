from flask import Flask, request, jsonify, Blueprint, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from celery.result import AsyncResult
from werkzeug.utils import secure_filename
import os, datetime, json
import numpy as np
import pickle

from ..extensions import db, bcrypt, jwt, cors
from ..models.models import User, Job, Company, Dataset
from ..algorithms import ConvoyCandidate

from .jobs import convoy_job, hb_detection, celery, generate_hb_plot, generate_convoy_plot, generate_context_plot

# create main blueprint
main = Blueprint("main", __name__,)

@main.route("/", methods=["GET"])
def home():
    """Generic home view"""
    return "sdmay-24-19 backend-api"

@main.route('/register', methods=['POST'])
def register_user():
    """
    Registration endpoint
    ---
    parameters:
        - name: body
          in: body
          required: true
          schema:
            id: RegisterUserData
            properties:
                username:
                    type: string
                password:
                    type: string
                email:
                    type: string
                full_name:
                    type: string
                company_id:
                    type: string
                role_id:
                    type: string
    responses:
        201:
            description: Success user registered
        500:
            description: Error
        400:
            description: Error username taken
    """
    data = request.get_json()

    # Check if the username is already taken
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already taken'}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # initialize new user object
    new_user = User(
        username=data['username'],
        password=hashed_password,
        full_name=data['full_name'],
        company_id=data.get('company_id'),
        role_id=data.get('role_id'),
        email=data.get('email')
    )

    # add to database and commit change
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@main.route('/login', methods=['POST'])
def login():
    """
    Login endpoint
    ---
    parameters:
        - name: body
          in: body
          required: true
          schema:
            id: LoginRequestData
            properties:
                username:
                    type: string
                password:
                    type: string
    responses:
        200:
            description: Successful login
            schema:
                id: LoginResponse
                properties:
                    access_token:
                        type: string
                        description: JWT token for authentication
                    username:
                        type: string
                        description: Username of authenticated user
                    full_name:
                        type: string
                        description: Full name of authenticated user
                    company_id:
                        type: string
                        description: Company id of authenticated user
        401:
            description: Error invalid credentials
    """
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        access_token = create_access_token(identity=user.user_id)
        response_data = {
            'access_token': access_token,
            'username': user.username,
            'full_name': user.full_name,
            'company_id': user.company_id
        }
        response = jsonify(response_data)
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 200
    else:
        return jsonify({'message': 'Invalid credentials'}), 401

@main.route('/password', methods=['POST'])
def password():
    """
    Request password reset
    ---
    parameters:
        - name: body
          in: body
          required: true
          schema:
            id: ResetPasswordRequestData
            properties:
                email:
                    type: string
    responses:
        200:
            description: Success
        401:
            description: Invalid email
    """
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user:
        #TODO: CREATE AND SEND EMAIL
        return 200
    else:
        return jsonify({'message': 'Invalid Email'}), 401

@main.route("/job/convoy", methods=["POST"])
@jwt_required()
def start_convoy():
    """
    Begin a new convoy job.
    ---
    parameters:
        - name: body
          in: body
          required: true
          schema:
            id: ConvoyJobStartData
            properties:
                dataset_id:
                    type: int
                    desc: ID of dataset for processing
                    required: True
                k:
                    type: int
                    desc: Minimum clusters elements, m (default = 10)
                    required: True
                m:
                    type: int
                    desc: Minimum consecutive timesteps, k (default = 50)
                    required: True
                eps:
                    type: float
                    desc: Distance parameter for clustering
                    required: True
                end:
                    tpye: int
                    desc: Last frame of convoy to detect
                    required: True
    responses:
        202:
            description: Success
            schema:
                id: CreatedJob
                properties:
                    job_id:
                        type: string
                        description: ID of the created job
        500:
            description: Error
        404:
            description: Error dataset not found
        405:
            description: Error no permissions to dataset
    """
    data = request.get_json()

    # retrieve dataset metadata from database
    dataset = Dataset.query.get(data['dataset_id'])

    # abort if no dataset found with ID
    if dataset is None:
        abort(404, "Dataset not found")

    # validate user has permissions to use dataset
    user = User.query.filter_by(user_id=get_jwt_identity()).first()
    if user.company_id != dataset.company_id:
        abort(401, "No permissions to use dataset")

    #TODO: add parameter data validation
    k = data["k"]
    m = data["m"]
    eps = data["eps"]
    end = data["end"] # end frame

    job = convoy_job.delay(filename=dataset.dataset_name, k_in=k, m_in=m, eps_in=eps, end=end)
    
    jobDb = Job(
        job_id = job.id,
        dataset_id = data['dataset_id'],
        user_id = get_jwt_identity(),
        company_id = user.company_id,
        start_time = datetime.datetime.utcnow()
    )
    db.session.add(jobDb)
    db.session.commit()

    return jsonify({"job_id": job.id}), 202

@main.route('/job/hbd', methods=['POST'])
@jwt_required()
def start_hbd():
    """
    Begin a new hydrogen bond detection job.
    ---
    parameters:
        - name: body
          in: body
          required: true
          schema:
            id: HBDJobStartData
            properties:
                convoy_id:
                    type: int
                    desc: ID of hydrogen bond detection job
                    required: True
                start:
                    type: int
                    desc: First frame of convoy to detect hydrogen bonds
                    required: True
                end:
                    tpye: int
                    desc: Last frame of convoy to detect hydrogen bonds
                    required: True
                index:
                    type: int
                    desc: Index of convoy to detect hydrogen bonds
                    required: True
    responses:
        202:
            description: Success
            schema:
                id: CreatedJob
                properties:
                    job_id:
                        type: string
                        description: ID of the created job
        500:
            description: Error
    """
    data = request.get_json()

    user = User.query.filter_by(user_id=get_jwt_identity()).first()

    convoy_job = celery.AsyncResult(data['convoy_id'])

    job = hb_detection.delay(
        filename = convoy_job.kwargs.get('filename'),
        convoy = convoy_job.result,
        start_frame=data['start'],
        end_frame=data['end'],
        convoy_index=data['index'],
        convoy_id=data['convoy_id']
        )
    
    jobDb = Job(
        job_id = job.id,
        user_id = get_jwt_identity(),
        dataset_id = Dataset.query.filter_by(dataset_name=convoy_job.kwargs.get('filename')).first().dataset_id,
        company_id = user.company_id,
        start_time = datetime.datetime.utcnow()
    )
    db.session.add(jobDb)
    db.session.commit()
    
    return jsonify({"job_id": job.id}), 202

@main.route("/job", methods=["GET"])
@jwt_required()
def get_all_jobs():
    """
    Get a list of all jobs started by current user.
    ---
    responses:
    200:
        description: Success
    """
    user = User.query.filter_by(user_id=get_jwt_identity()).first()
    jobs = Job.query.filter_by(company_id=user.company_id).all()
    job_list = []

    for job in jobs:
        jobData = celery.AsyncResult(job.job_id)
        job_list.append({
            "job_id": jobData.task_id,
            "job_name": jobData.name,
            "status": jobData.status,
            "date_done": jobData.date_done,
            'user': User.query.filter_by(user_id=job.user_id).first().full_name,
            'dataset': Dataset.query.filter_by(dataset_id=job.dataset_id).first().dataset_name, 
            'company': Company.query.filter_by(company_id=job.company_id).first().company_name,
            'start_time': job.start_time
        })

    return jsonify({'jobs': job_list}), 200

@main.route("/job/<jobIn>", methods=["GET"])
@jwt_required()
def get_job_status(jobIn):
    """
    Retrieve the status of the provided job from id.
    ---
    parameters:
        - name: job_id
          in: path
          type: string
          required: true
          description: ID of job
    definitions:
        JobInfo:
            type: object
            properties:
                job_id:
                    type: string
                    description: ID of the job
                status:
                    type: string
                    description: Current status of the job.
                date_done:
                    type: timestamp
                    description: Timestamp of job completion
                job_nam:
                    type: string
                    description: Type of job
                result:
                    type: Unknown
                    description: Result of the job
    responses:
        200:
            description: Success
            schema:
                $ref: '#/definitions/JobInfo'
        500:
            desciption: Error
        401:
            description: Error Unauthorized
    """
    #TODO: check if user has permission to check job
    job = celery.AsyncResult(jobIn)
    result = job.result
    if job.result:
        try:
            obj = pickle.loads(job.result)
            if (isinstance(obj, list)) and (isinstance(obj[0], ConvoyCandidate)):
                result = [convoy.serialize() for convoy in obj]
            else:
                result = obj
        except:
            pass
    response = {
        "job_id": job.task_id,
        "job_name": job.name,
        "status": job.status,
        "date_done": job.date_done,
        "result": result
    }

    return jsonify(response), 200

@main.route("/dataset", methods=["POST"])
@jwt_required()
def upload_dataset():
    """
    Endpoint to upload new dataset and cache metadata in database
    ---
    parameters:
        - name: file
          in: file
          required: true
    responses:
        201:
            description: Success dataset uploaded
        400:
            description: Error
    """

    uploaded_file = request.files['file']
    sec_filename = secure_filename(uploaded_file.filename)

    if sec_filename == '':
        # no null filenames
        abort(400, "Null filename")

    # retrieve user information first
    user = User.query.filter_by(user_id=get_jwt_identity()).first()

    if not os.path.exists('/usr/src/app/data/'):
        os.makedirs('/usr/src/app/data/', mode=0o777)

    # check for duplicate filenames in database
    dup_dataset = Dataset.query.filter_by(dataset_name=sec_filename).first()
    if (dup_dataset is not None) and (os.path.exists(f'/usr/src/app/data/{sec_filename}')):
        # no mismatch, true diplicate
        abort(400, "Duplicate filename")

    if (dup_dataset is not None):
        # mismatch (file exists only in database)
        db.session.delete(dup_dataset)
        db.session.commit()
        abort(400, "Duplicate filename only in database, deleting record.")

    if os.path.exists(f'/usr/src/app/data/{sec_filename}'):
        # mismatch (file exists only in filesystem)
        os.remove(f'/usr/src/app/data/{sec_filename}')
        abort(400, "Duplicate filename only in filesystem, deleting file")

    # initialize dataset object
    dataset_metadata = Dataset(
        dataset_name=sec_filename,
        user_id=user.user_id,
        company_id=user.company_id
    )

    # save file
    uploaded_file.save(f'/usr/src/app/data/{sec_filename}')

    # add to database and commit change if successful
    db.session.add(dataset_metadata)
    db.session.commit()

    return jsonify({'message': "Upload successful"}), 201

@main.route('/dataset', methods=['GET'])
@jwt_required()
def list_company_datasets():
    """
    List all available datasets under company.
    ---
    responses:
        200:
            description: List of all datasets under companies
    """
    user = User.query.filter_by(user_id=get_jwt_identity()).first()
    cid = user.company_id
    companyName = Company.query.filter_by(company_id=cid).first().company_name
    datasets = Dataset.query.filter_by(company_id=cid).all()

    dataset_list = [{'dataset_id': dataset.dataset_id, 'dataset_name': dataset.dataset_name, 
                     'company_name': companyName, 'user': User.query.filter_by(user_id=dataset.user_id).first().full_name} for dataset in datasets]
    return jsonify({'datasets': dataset_list}), 200

@main.route('/companies', methods=['GET'])
def list_companies():
    """
    List all companies in database
    ---
    responses:
        200:
            description: List of all companies
    """
    companies = Company.query.all()
    company_list = [{'company_id': company.company_id, 'company_name': company.company_name} for company in companies]
    return jsonify({'companies': company_list}), 200

@main.route('/companies/<id>', methods=['GET'])
def get_company_info(id):
    """
    Get company information from id
    ---
    parameters:
        - name: id
          in: path
          type: string
          required: true
          description: ID of company
    responses:
        200:
            description: List company details
            schema:
                id: CompanyInfo
                properties:
                    company_id:
                        type: string
                        description: ID of the company
                    company_name:
                        type: string
                        description: Name of the company
                    company_desc:
                        type: string
                        description: Description of the company
        404:
            description: Error company not found
        500:
            description: Error
    """
    print(id)
    company = Company.query.get(id)
    response = {
        'company_id': company.company_id,
        'company_name': company.company_name,
        'company_desc': company.company_desc
    }
    return jsonify(response), 200

@main.route('/visualize/hb', methods=["POST"])
def visualize_hb():
    """
    Generate the visualization of the Hydrogen Bonds in a Convoy
    ---
    parameters:
        - name: convoy_id
          in: body
          type: string
          required: true
          description: ID of convoy job for visualization
        - name: hbd_id
          in: body
          type: string
          required: true
          description: ID of hydrogen bond detection job for visualization
        - name: index
          in: body
          type: int
          required: true
          description: Index of the convoy to visualize
    responses:
        200:
            description: Success
        500:
            desciption: Error
        401:
            description: Error Unauthorized
    """
    #TODO: add user verification
    data = request.get_json()
    hb = celery.AsyncResult(data['hbd_id'])
    convoy = celery.AsyncResult(hb.kwargs.get('convoy_id'))
    return generate_hb_plot(convoy.result, hb.result, convoy.kwargs.get('filename'), convoy.kwargs.get('end'), convoy_index=hb.kwargs.get('convoy_index'))

@main.route('/visualize/convoy', methods=["POST"])
def visualize_convoy():
    """
    Generate the visualization of the Convoy
    ---
    parameters:
        - name: convoy_id
          in: body
          type: string
          required: true
          description: ID of convoy job for visualization
        - name: index
          in: body
          type: int
          required: true
          description: Index of the convoy to visualize
    responses:
        200:
            description: Success
        500:
            desciption: Error
        401:
            description: Error Unauthorized
    """
    #TODO: add user verification
    data = request.get_json()
    convoy = celery.AsyncResult(data['convoy_id'])
    return generate_convoy_plot(convoy.result, convoy.kwargs.get('filename'), convoy.kwargs.get('end'), convoy_index=data['index'])

@main.route('/visualize/context', methods=["POST"])
def visualize_context():
    """
    Generate the visualization of the Convoy Context
    ---
    parameters:
        - name: convoy_id
          in: body
          type: string
          required: true
          description: ID of convoy job for visualization
    responses:
        200:
            description: Success
        500:
            desciption: Error
        401:
            description: Error Unauthorized
    """
    #TODO: add user verification
    data = request.get_json()
    convoy = celery.AsyncResult(data['convoy_id'])
    return generate_context_plot(convoy.result, convoy.kwargs.get('filename'), convoy.kwargs.get('end'))

@main.route('/companies/add', methods=['POST'])
def register_company():

    """
    Add company to database
    ---
    parameters:
        - name: body
          in: body
          required: true
          schema:
            id: RegisterCompanyData
            properties:
                company_name:
                    type: string
                company_desc:
                    type: string
    responses:
        201:
            description: Success company created
        500:
            description: Error
        400:
            description: Error company name taken
    """
    data = request.get_json()

    # Check if the username is already taken
    if Company.query.filter_by(company_name=data['company_name']).first():
        return jsonify({'message': 'Company name already taken'}), 400

    # initialize new user object
    new_company = Company(
        company_name = data['company_name'],
        company_desc = data['company_desc']
    )

    # add to database and commit change
    db.session.add(new_company)
    db.session.commit()

    return jsonify({'message': 'Company registered successfully'}), 201

@main.route('/users/<username>', methods=['GET'])
def get_user(username):
    user = User.query.filter_by(username=username).first()
    if user:
        user_info = {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
            'company_id': user.company_id,
            'role_id': user.role_id
        }
        return jsonify(user_info)
    else:
        return jsonify({'error': 'User not found'}), 404
    
@main.route('/update_role/<username>', methods=['PUT'])
def update_user_role(username):
    """
    Update user role endpoint
    ---
    parameters:
        - name: username
          in: path
          type: string
          required: true
        - name: body
          in: body
          required: true
          schema:
            id: UpdateRoleData
            properties:
                role_id:
                    type: integer
    responses:
        200:
            description: Success user role updated
        404:
            description: User not found
        400:
            description: Invalid role_id provided
        500:
            description: Error
    """
    data = request.get_json()
    role_id = data.get('role_id')

    # Check if the user exists
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Check if role_id is provided and valid
    if not isinstance(role_id, int):
        return jsonify({'error': 'Invalid role_id provided'}), 400

    # Update user's role_id
    user.role_id = role_id
    db.session.commit()

    return jsonify({'message': 'User role updated successfully'}), 200
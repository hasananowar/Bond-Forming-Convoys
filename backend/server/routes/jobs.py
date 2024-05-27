import os, time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import plotly.io as pio
import numpy as npy
import plotly.express as px
import plotly.graph_objs as go
import pickle, datetime
from sklearn.cluster import DBSCAN
from contextlib import redirect_stdout

from flask_sqlalchemy import SQLAlchemy
from celery import Celery
from ..algorithms import CMC, ConvoyCandidate, getAtomTypes, getClusterHB
from ..extensions import db

celery = Celery(__name__)
celery.conf.update(result_extended=True)
celery.conf.broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379")
celery.conf.result_backend = os.environ.get("CELERY_RESULT_BACKEND", "db+mysql://convoy:password@host.docker.internal:3306/convoy")

def transpose_data(filename, end):
    filePath = f'/usr/src/app/data/{filename}'
    data = np.load(filePath)
    data = data[:end]
    data.shape
    convoy_data = np.transpose(data, (1,0,2)).tolist()
    return convoy_data

@celery.task(bind=True)
def convoy_job(self,
        filename: str, #dataset name
        k_in: int = 5, # minimum cluster elements, m
        m_in: int = 25, # minimum consecutive timesteps, k
        eps_in: float = 3.5, # epsilon range, eps
        end: int = 500, #ending fram
    ):

    convoy_data = transpose_data(filename, end)
    cluster = DBSCAN(eps=eps_in)
    clf = CMC(cluster, k=k_in, m=m_in)
    convoys = clf.fit_predict(convoy_data)
    return pickle.dumps(convoys)

@celery.task(bind=True)
def hb_detection(self,
        filename, # dataset name
        convoy,
        start_frame,
        end_frame,
        convoy_index,
        convoy_id
    ):
    filePath = f'/usr/src/app/data/{filename}'
    atomTypePath = f'/usr/src/app/data/atomType.pkl'

    # Import data from file
    data = np.load(filePath)
    atomTypes = getAtomTypes(atomTypePath)
    convoys = pickle.loads(convoy)

    cluster_indices = convoys[convoy_index].indices

    timeFrame = np.arange(start_frame, end_frame)
    data = data[:end_frame]

    hbonds = [[] for _ in range(end_frame)]
    for i in timeFrame:
        progress = str(round((i/(end_frame-start_frame))*100, 2))
        self.update_state(state=progress)
        HBatoms = getClusterHB(data, cluster_indices, atomTypes, i)
        hbonds[i] = HBatoms[1]

    return pickle.dumps(hbonds)

def generate_context_plot(convoys, filename, end_time):
    convoys = pickle.loads(convoys)
    convoy_data = transpose_data(filename, end_time)

    # Extract the indices of the elements in the convoy
    element_indices = []
    for convoy in convoys:
        element_indices.append(list(convoy.indices))

    x_coords = []
    y_coords = []
    z_coords = []
    convoy_num = []
    timestamps = []

    step_size = max(1, len(convoy_data[0]) // 5)

    for frame in range(0, len(convoy_data[0]), step_size):
        for index in range (len(convoy_data)):
            x, y, z = convoy_data[index][frame]
            x_coords.append(x)
            y_coords.append(y)
            z_coords.append(z)
            timestamps.append(frame)
            tempCon = 0
            for cNum, convoy in enumerate(element_indices):
                if index in convoy:
                    tempCon = cNum
                    break
            convoy_num.append(str(tempCon))

    # Create a DataFrame with element coordinates
    elements_df = pd.DataFrame({'X': x_coords, 'Y': y_coords, 'Z': z_coords, 'Timestamp': timestamps, 'Convoy': convoy_num})

    # Calculate a margin for better visualization
    margin = 10

    # Create a 3D scatter plot of elements on the first frame with explicit axis range
    fig = px.scatter_3d(elements_df, x='X', y='Y', z='Z',
                        animation_frame='Timestamp',
                        title='Convoy Context',
                        labels={'X': 'X Coordinate', 'Y': 'Y Coordinate', 'Z': 'Z Coordinate'},
                        color='Convoy',
                        range_x=[min(x_coords), max(x_coords)],
                        range_y=[min(y_coords), max(y_coords)],
                        range_z=[min(z_coords), max(z_coords)],
                        color_discrete_sequence = px.colors.qualitative.Prism)


    # Define consistent axis ranges for X, Y, and Z axes
    x_range = [min(x_coords), max(x_coords)]
    y_range = [min(y_coords), max(y_coords)]
    z_range = [min(z_coords), max(z_coords)]

    # Apply consistent axis ranges
    fig.update_scenes(xaxis_range=x_range, yaxis_range=y_range, zaxis_range=z_range)

    fig.layout.updatemenus[0].buttons[0].args[1]['frame']['duration'] = 500
    fig.layout.updatemenus[0].buttons[0].args[1]['transition']['duration'] = 10

    # Show the static 3D graph
    fig.show()

    return pio.to_json(fig)
    # Show the animated scatter chart
    # return fig.to_html(full_html=False, include_plotlyjs='cdn')

def generate_convoy_plot(convoys, filename, end_time, convoy_index):
    convoys = pickle.loads(convoys)
    convoy = convoys[convoy_index]
    convoy_data = transpose_data(filename, end_time)
    # Extract the indices of the elements in the convoy
    element_indices = list(convoy.indices)
    # Define the maximum number of time slices to use (e.g., 300)
    max_time_slices = 150
    # Calculate the step size to skip time slices while staying within the limit
    step_size = max(1, (convoy.end_time - convoy.start_time) // max_time_slices)

    x_coords = []
    y_coords = []
    z_coords = []
    timestamps = []
    element_ids = []

    # Extract the coordinates, timestamps, and element IDs while skipping time slices
    for frame in range(convoy.start_time, convoy.end_time, step_size):
        for index in element_indices:
            x, y, z = convoy_data[index][frame]
            x_coords.append(x)
            y_coords.append(y)
            z_coords.append(z)
            timestamps.append(frame)
            element_ids.append(index)  # Store the element ID


    # Create a DataFrame with the convoy data
    convoy_df = pd.DataFrame({'X': x_coords, 'Y': y_coords, 'Z': z_coords,
                            'Timestamp': timestamps, 'Element_ID': element_ids})

    # Create an animated scatter chart
    fig = px.scatter_3d(convoy_df, x='X', y='Y', z='Z', animation_frame='Timestamp',
                        title=f'Convoy {convoy_index + 1}', labels={'Timestamp': 'Time Step'},
                        color='Element_ID')  # Color points by Element ID

    # Customize the chart layout
    fig.update_layout(scene=dict(aspectmode='cube'))

    # Define consistent axis ranges for X, Y, and Z axes
    x_range = [min(x_coords), max(x_coords)]
    y_range = [min(y_coords), max(y_coords)]
    z_range = [min(z_coords), max(z_coords)]

    # Apply consistent axis ranges
    fig.update_scenes(xaxis_range=x_range, yaxis_range=y_range, zaxis_range=z_range)

    fig.update_layout(transition = {'duration': 10})

    # Show the animated scatter chart
    fig.show()
    # Show the animated scatter chart
    return pio.to_json(fig)

def generate_hb_plot(convoys_in, hb_in, filename, end_time, convoy_index):
    convoy_data = transpose_data(filename, end_time)
    convoys = pickle.loads(convoys_in)
    hb = pickle.loads(hb_in)
    convoy = convoys[convoy_index]
    # Extract the indices of the elements in the convoy
    element_indices = list(convoy.indices)
    HBSize = 15
    regSize = 5

    x_coords = []
    y_coords = []
    z_coords = []
    timestamps = []
    element_ids = []
    hbs = []
    size = []

    # Extract the coordinates, timestamps, and element IDs while skipping time slices
    for frame in range(len(hb)-1):
        for index in element_indices:
            print(frame)
            x, y, z = convoy_data[index][frame]
            x_coords.append(x)
            y_coords.append(y)
            z_coords.append(z)
            timestamps.append(frame)
            element_ids.append(index)  # Store the element ID

            # Hydrogen Bond Visualization
            if (frame >= len(hb)) or (not hb[frame]):
                hbs.append("None")
                size.append(regSize)
                continue

            if hb[frame][0] == index:
                hbs.append("N")
                size.append(HBSize)
                continue

            if hb[frame][1] == index:
                hbs.append("HN")
                size.append(HBSize)
                continue
            
            if hb[frame][2] == index:
                hbs.append("O")
                size.append(HBSize)
                continue

            hbs.append("None")
            size.append(regSize)

    # Create a DataFrame with the convoy data
    convoy_df = pd.DataFrame({'X': x_coords, 'Y': y_coords, 'Z': z_coords,
                            'Timestamp': timestamps, 'Element_ID': element_ids,
                            'Hydrogen_Bonds': hbs, 'Size': size})

    # Create an animated scatter chart
    fig = px.scatter_3d(convoy_df, x='X', y='Y', z='Z', animation_frame='Timestamp',
                        title=f'Convoy {convoy_index + 1}', labels={'Timestamp': 'Time Step', 'Element ID': 'Element_ID'},
                        color='Hydrogen_Bonds', size='Size')  # Color points by Element ID

    # Customize the chart layout
    fig.update_layout(scene=dict(aspectmode='cube'))

    # Define consistent axis ranges for X, Y, and Z axes
    x_range = [min(x_coords), max(x_coords)]
    y_range = [min(y_coords), max(y_coords)]
    z_range = [min(z_coords), max(z_coords)]

    # Apply consistent axis ranges
    fig.update_scenes(xaxis_range=x_range, yaxis_range=y_range, zaxis_range=z_range)

    fig.update_layout(transition = {'duration': 10})

    # Show the animated scatter chart
    fig.show()
    # Show the animated scatter chart
    return pio.to_json(fig)
import numpy as np
import pickle

def getCoordinates(data, index):
    return data[index]

def coordinate_transform (x):
    x = 72.475 + x  if x < 0 else x
    return x

def periodic_boundary (x1, x2):
    """
    Apply periodic boundaries
    Periodic Boundaries in X and Y direction is 72 A.
    Z axis does not have any periodic boundary
    
    So, the periodicity conditions

    Difference in X axis = if |x2 − x1|> 36:
                                72 −|x2 − x1|
                            
                         else:
                                x2 − x1
    
    Difference in Y axis = same as X

    Parameters
    ----------
    x1 : axis coordinates of atom 1  
    x2 : axis coordinates of atom 2 

    Returns
    -------
    differences of coordinates values with periodicity

    """
    
    x1 = coordinate_transform (x1)
    
    x2 = coordinate_transform (x2)

    coord_diff = ((x2 - x1)/abs(x2 - x1))*(72.475-abs(x2 - x1)) if abs(x2 - x1)>36.2375 else (x2 - x1)
    
    return coord_diff

def distance_periodicity (atom1, atom2):
    
    """
    Apply periodic boundaries
    
    Periodic Boundaries in X and Y direction is 72 A.
    Z axis does not have any periodic boundary
    
    So, the periodicity conditions

    Distance in X axis = if |x2 − x1|> 36:
                                72 −|x2 − x1|
                            
                         else:
                                x2 − x1
    
    Distance in Y axis = same as X
    
    Euclidean Shortest Distance = √(〖"(Distance in X axis)" 〗^2+〖"(Distance in Y axis)" 〗^2+〖"(Distance in Z axis)" 〗^2 )

    Parameters
    ----------
    X1 : Numpy 1D array
        x axis coordinates of atom 1 trajectory
    Y1 : Numpy 1D array
        y axis coordinates of atom 1 trajectory 
    Z1 : Numpy 1D array
        z axis coordinates of atom 1 trajectory 
    X2 : Numpy 1D array
        x axis coordinates of atom 2 trajectory 
    Y2 : Numpy 1D array
        y axis coordinates of atom 2 trajectory 
    Z2 : Numpy 1D array
        z axis coordinates of atom 2 trajectory 

    Returns
    -------
    distance: Numpy 1D array
            Euclidean distance of (X1,Y1,Z1) and (X2,Y2,Z2)

    """

    x_coord_diff = periodic_boundary (atom1[0], atom2[0])
        
    y_coord_diff = periodic_boundary (atom1[1], atom2[1])

    z_coord_diff = (atom2[2]-atom1[2])

    euclidean_distance = np.sqrt(np.square(x_coord_diff) + np.square(y_coord_diff) + np.square(z_coord_diff))
    
    return euclidean_distance, x_coord_diff, y_coord_diff, z_coord_diff

def calc_angle (vector1,vector2):
    
    """ Returns the angle between two vectors  """ 
    
    c = np.dot(vector1,vector2) / (np.linalg.norm(vector1)* np.linalg.norm(vector2))
    angle = np.arccos(c)
    return angle

def HB_truth(hn, n, o):
    euclidean_distance_no, x_coord_diff_no, y_coord_diff_no, z_coord_diff_no = distance_periodicity(n, o)
    euclidean_distance_hnn, x_coord_diff_hnn, y_coord_diff_hnn, z_coord_diff_hnn = distance_periodicity(hn, n)
    euclidean_distance_hno, x_coord_diff_hno, y_coord_diff_hno, z_coord_diff_hno = distance_periodicity(hn, o)
    
    vector_hnn = [x_coord_diff_hnn, y_coord_diff_hnn, z_coord_diff_hnn]
    vector_hno = [x_coord_diff_hno, y_coord_diff_hno, z_coord_diff_hno]

    angle = calc_angle(vector_hno, vector_hnn)

    if (angle > 2.35619) and  (angle <= 3.14159) and euclidean_distance_no <= 3.5:
        return True
    return False

def HBCheck(data, HBatoms, column):
    for hn in HBatoms["hn"]:
        for n in HBatoms["n"]:
            coord_hn = getCoordinates(data[column], hn)
            coord_n = getCoordinates(data[column], n)
            for o in HBatoms["o"]:
                coord_o = getCoordinates(data[column], o)
                if HB_truth(coord_hn, coord_n, coord_o):
                    return True, [hn, n, o]
    
    return False, None


def getAtomTypes(file_path):
    with open(file_path, "rb") as file:
        atomTypes = pickle.load(file)

    return atomTypes

def find_key_by_value(input_value, dictionary):
    for key, value in dictionary.items():
        if input_value in value:
            return key
    return None

def getClusterHB(data, convoy_cluster_indices, atomTypes, timeFrame):
    atomsIHave = {
        "n": [],
        "hn": [],
        "o": []
    }
    for index in convoy_cluster_indices:
        if not find_key_by_value(index, atomTypes) == None:
            atomsIHave[find_key_by_value(index, atomTypes)].append(index)
    
    HB, HBatoms = HBCheck(data, atomsIHave, timeFrame)

    return HB, HBatoms

class ConvoyCandidate(object):
    """
    Attributes:
        indices(set): The object indices assigned to the convoy
        is_assigned (bool):
        start_time (int):  The start index of the convoy
        end_time (int):  The last index of the convoy
        index (int):    The index of the convoy among all data
    """
    __slots__ = ('indices', 'is_assigned', 'start_time', 'end_time')

    def __init__(self, indices, is_assigned, start_time, end_time):
        self.indices = indices
        self.is_assigned = is_assigned
        self.start_time = start_time
        self.end_time = end_time

    def __repr__(self):
        return '<%r %r indices=%r, is_assigned=%r, start_time=%r, end_time=%r>' % (self.__class__.__name__, id(self), self.indices, self.is_assigned, self.start_time, self.end_time)
    
    def serialize(self):
        return {
            'num_of_indices': len(self.indices),
            'start_time': self.start_time,
            'end_time': self.end_time
        }
    
class CMC(object):
    """Coherence Moving Cluster (CMC) algorithm

    Attributes:
        k (int):  Min number of consecutive timestamps to be considered a convoy
        m (int):  Min number of elements to be considered a convoy
    """
    def __init__(self, clf, k, m):
        self.clf = clf
        self.k = k
        self.m = m

    def fit_predict(self, X, y=None, sample_weight=None):
        convoy_candidates = set()
        columns = len(X[0])
        column_iterator = range(columns)
        output_convoys = []

        for column in column_iterator:
            current_convoy_candidates = set()
            values = [row[column] if isinstance(row[column], (list, set)) else [row[column]] for row in X]
            if len(values) < self.m:
                continue
            clusters = self.clf.fit_predict(values, y=y, sample_weight=sample_weight)
            unique_clusters = set(clusters)
            clusters_indices = dict((cluster, ConvoyCandidate(indices=set(), is_assigned=False, start_time=None, end_time=None)) for cluster in unique_clusters)

            for index, cluster_assignment in enumerate(clusters):
                clusters_indices[cluster_assignment].indices.add(index)

            # update existing convoys
            for convoy_candidate in convoy_candidates:
                convoy_candidate_indices = convoy_candidate.indices
                convoy_candidate.is_assigned = False
                for cluster in unique_clusters:
                    cluster_indices = clusters_indices[cluster].indices
                    cluster_candidate_intersection = cluster_indices & convoy_candidate_indices
                    if len(cluster_candidate_intersection) < self.m:
                        continue
                    convoy_candidate.indices = cluster_candidate_intersection
                    current_convoy_candidates.add(convoy_candidate)
                    convoy_candidate.end_time = column
                    clusters_indices[cluster].is_assigned = convoy_candidate.is_assigned = True

                # check if candidates qualify as convoys
                candidate_life_time = (convoy_candidate.end_time - convoy_candidate.start_time) + 1
                if (not convoy_candidate.is_assigned or column == column_iterator[-1]) and candidate_life_time >= self.k:
                    output_convoys.append(convoy_candidate)

            # create new candidates
            for cluster in unique_clusters:
                cluster_data = clusters_indices[cluster]
                if cluster_data.is_assigned:
                    continue
                cluster_data.start_time = cluster_data.end_time = column
                current_convoy_candidates.add(cluster_data)
            convoy_candidates = current_convoy_candidates
        return output_convoys
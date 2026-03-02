import pandas as pd

def json_to_excel(json_data, output_path):
    df = pd.json_normalize(json_data)
    df.to_excel(output_path, index = False)
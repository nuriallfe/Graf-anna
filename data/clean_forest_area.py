import pandas as pd

df = pd.read_csv('forest_area.csv')
df['date'] = df['date'].astype(str).str.extract(r'(\d{4})')  # Get the year from "(2023)"
df['date'] = df['date'] + '-01-01'  # Add dummy day/month
df.to_csv('forest_area.csv', index=False)

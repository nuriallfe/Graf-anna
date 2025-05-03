import pandas as pd

df = pd.read_csv('forest_area.csv')
df['date'] = df['date'].astype(str).str.extract(r'(\d{4})')  # Get the year from "(2023)"
df['date'] = df['date'] + '-01-01'  # Add dummy day/month


wide = df.pivot(index='date', columns='country', values='Forest area (sq. km)')

# 3. Turn Year back into a column and save
wide_reset = wide.reset_index()

wide_reset.to_csv('forest_area.csv', index=False)


import json

data = [{"a": i} for i in range(60000)]

with open("big.json","w") as f:
    json.dump(data,f)
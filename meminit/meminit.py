import json

data = map(chr, json.load(file('meminit.json', 'rb')))


file('meminit.json.binary', 'wb').write(''.join(data))
file('meminit.json.str', 'wb').write(repr(''.join(data)))


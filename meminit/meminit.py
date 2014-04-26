import json
import base64

data = ''.join(map(chr, json.load(file('meminit.json', 'rb'))))
print 'data length:', len(data)

def tinystr(s):
    s = repr(s)
    for i in range(8):
        s = s.replace('\\x0' + str(i), '\\' + str(i))
    return s

file('meminit.json.binary', 'wb').write(data)
file('meminit.json.str', 'wb').write(repr(data))
file('meminit.json.minstr', 'wb').write(tinystr(data))
file('meminit.json.base64', 'wb').write(repr(base64.b64encode(data)))

if 0 == len(data) % 4:
    out = []
    for i in range(0, len(data), 4):
        a = data[i]
        b = data[i+1]
        c = data[i+2]
        d = data[i+3]
        out.append(ord(a) | (ord(b) << 8) | (ord(c) << 16) | (ord(d) << 24))
    file('meminit.json.int32', 'wb').write('[' + ','.join(map(str, out)) + ']')

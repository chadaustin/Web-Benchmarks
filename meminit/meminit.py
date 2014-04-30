# thanks to evanw for his improvements https://gist.github.com/evanw/11339324

import os
import re
import json
import base64
 
path = 'meminit.json'
data = ''.join(map(chr, json.loads(open(path, 'rb').read())))
print 'data length:', len(data)
 
def tinystr(s):
    hex_to_octal = lambda x: '\\%s' % (oct(int(x.group(1), 16))[1:] or 0)
    s = repr(s)
    s = re.sub(r'\\x([0-1][0-9A-Fa-f])(?:(?=[^0-9])|$)', hex_to_octal, s)
    return s
 
def size(bytes):
    return '%.1f KB' % (bytes / 1000.0)
 
def write(type, data):
    output = path + '.' + type
    file(output, 'wb').write(data)
    os.system('gzip --stdout --best %s > %s.gz' % (output, output))
    gzip = file(output + '.gz', 'rb').read()
    print '| %14s | %17s | %12s |' % (type, size(len(data)), size(len(gzip)))
 
print '| Representation | uncompressed size | gzipped size |'
print '| -------------- | ----------------- | ------------ |'
 
write('binary', data)
write('minstr', tinystr(data))
write('str', repr(data))
write('int8', '[' + ','.join(map(str, map(ord, data))) + ']')
write('base64', repr(base64.b64encode(data)))
 
if 0 == len(data) % 4:
    out = []
    for i in range(0, len(data), 4):
        a = data[i]
        b = data[i+1]
        c = data[i+2]
        d = data[i+3]
        out.append(ord(a) | (ord(b) << 8) | (ord(c) << 16) | (ord(d) << 24))
    write('int32', '[' + ','.join(map(str, out)) + ']')

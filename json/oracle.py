import sys
import json

[json_file] = sys.argv[1:]
data = json.load(file(json_file, 'rb'))

class Stats:
    def __init__(self):
        self.null_count = 0
        self.false_count = 0
        self.true_count = 0
        self.number_count = 0
        self.object_count = 0
        self.array_count = 0
        self.string_count = 0
        self.total_string_length = 0
        self.total_array_length = 0
        self.total_object_length = 0
        self.total_number_value = 0

def traverse(stats, node):
    if isinstance(node, list) or isinstance(node, tuple):
        stats.array_count += 1
        stats.total_array_length += len(node)
        for e in node:
            traverse(stats, e)
    elif isinstance(node, dict):
        stats.object_count += 1
        stats.total_object_length += len(node)
        for e in node.values():
            traverse(stats, e)
    elif node is None:
        stats.null_count += 1
    elif node is True:
        stats.true_count += 1
    elif node is False:
        stats.false_count += 1
    elif isinstance(node, basestring):
        stats.string_count += 1
        stats.total_string_length += len(node)
    else:
        stats.number_count += 1
        stats.total_number_value += node
        
stats = Stats()
traverse(stats, data)

print 'null_count', stats.null_count
print 'false_count', stats.false_count
print 'true_count', stats.true_count
print 'number_count', stats.number_count
print 'object_count', stats.object_count
print 'array_count', stats.array_count
print 'string_count', stats.string_count
print 'total_string_length', stats.total_string_length
print 'total_array_length', stats.total_array_length
print 'total_object_length', stats.total_object_length
print 'total_number_value', stats.total_number_value

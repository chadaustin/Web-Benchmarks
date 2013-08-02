import random
import json

random.seed(0)

inventory = set()
for i in range(10000):
    inventory.add(random.randint(0, 10000000))
inventory = list(sorted(inventory))

json.dump(inventory, file('inventory_list.json', 'wb'));

previous = 0
differences = []
for i in inventory:
    differences.append(i - previous)
    previous = i
json.dump(differences, file('inventory_differences.json', 'wb'))

json.dump(["http://hostname.com/product/" + str(pid) for pid in inventory], file('inventory_urls.json', 'wb'))


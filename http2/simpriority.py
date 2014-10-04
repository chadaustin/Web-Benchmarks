class Clock:
    def __init__(self):
        self.time = 0

    def advance(self, elapsed):
        self.time += elapsed

class H2Connection:
    def __init__(self, clock):
        self.clock = clock

        self.currentID = 0
        self.data = {0: None}      # ID -> (URL, onComplete)
        self.children = {0: set()} # ID -> set<ID>
        self.parent = {0: None}    # ID -> ID

    def openStream(self, url, parent, onComplete):
        self.currentID += 1
        stream = self.currentID

        assert parent in self.data

        self.data[stream] = (url, onComplete)
        self.children[stream] = set()
        self.parent[stream] = parent
        self.children[parent].add(stream)

        return stream

    def setPriority(self, stream, parent):
        # O(depth)
        cycle = False
        cursor = parent
        while cursor:
            if cursor == stream:
                cycle = True
                break
            cursor = self.parent[cursor]
        
        if cycle:
            self.setPriority(parent, self.parent[stream])

        self.children[self.parent[stream]].remove(stream)
        self.children[parent].add(stream)
        self.parent[stream] = parent

    def simulate(self):
        current = self.children[0]
        while current:
            yield {self.data[f][0] for f in current}

            next = set()
            for f in current:
                next.update(self.children[f])
            current = next

class Prioritizer:
    def __init__(self, connection):
        self.connection = connection

        self.byPriority = {} # priority -> [stream]

    def request(self, url, priority, onComplete):
        
        
        self.connection.request(url, parentID, onComplete)

        priorities = sort(self.byPriority.keys())

        if priority > max(priority):
            self.roots

        #self.byPriority = 

def after(cb, N):
    assert N
    def fn():
        nonlocal N, cb
        assert N >= 0
        N -= 1
        if not N:
            cb()
            del cb
    return cb

def loadObject(connection, url, priorityModifier, onInitialLoad, onCompleteLoad):
    def loadAssets():
        cb2 = after(onCompleteLoad, 11)
        # hires textures
        for i in range(10):
            connection.request('hires' + str(i), 0 + priorityModifier, cb2)

        # meshes
        def objectVisible():
            cb2()
            onInitialLoad()

        cb1 = after(objectVisible, 20)
        for i in range(10):
            connection.request('mesh' + str(i), 100 + priorityModifier, cb1)
        for i in range(10):
            connection.request('lores' + str(i), 100 + priorityModifier, cb1)

    connection.request(url, 200 + priorityModifier, loadAssets)

def main():
    clock = Clock()

    conn = H2Connection(clock)
    prio = Prioritizer(conn)

    def onSceneVisible():
        print('visible:', clock.time)

    def onSceneComplete():
        print('complete:', clock.time)

    cb1 = after(onSceneVisible, 12)
    cb2 = after(onSceneComplete, 12)

    loadObject(prio, 'room', 90, cb1, cb2)
    loadObject(prio, 'me', 90, cb1, cb2)
    for i in range(10, 20):
        loadObject(prio, 'avatar', i, cb1, cb2)
        loadObject(prio, 'room', i, cb1, cb2)

    c.simulate()

if __name__ == '__main__':
    main()

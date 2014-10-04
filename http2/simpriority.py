class Clock:
    def __init__(self):
        self.time = 0

    def advance(self, elapsed):
        self.time += elapsed

def IDGetter():
    id = 0
    def getID():
        nonlocal id
        id += 1
        return id
    return getID
getID = IDGetter()

class H2Stream:
    def __init__(self, url, onComplete):
        self.url = url
        self.onComplete = onComplete

        self.id = getID()

        self.parent = 0
        self.children = set()

class H2Connection:
    def __init__(self, clock):
        self.clock = clock

        self.liveStreams = {} # ID -> H2Stream
        self.roots = set()

    def openStream(self, url, dependency, onComplete):
        stream = H2Stream(url, onComplete)
        self.liveStreams[stream.id] = stream

        if dependency:
            self.liveStreams[dependency].children.add(stream)
            stream.parent = self.liveStreams[dependency]
        else:
            self.roots.add(stream)
            stream.parent = None
        
        return stream.id

    def setPriority(self, streamID, parentID):
        stream = self.liveStreams[streamID]
        parent = self.liveStreams[parentID] if parentID else None

        cycle = False
        cursor = parent
        while cursor:
            if cursor == stream:
                cycle = True
                break
            cursor = cursor.parent
        
        if cycle:
            self.setPriority(parentID, stream.parent.id if stream.parent else 0)

        if stream.parent:
            stream.parent.children.remove(stream)
        else:
            self.roots.remove(stream)

        if parent:
            parent.children.add(stream)
            stream.parent = parent
        else:
            self.roots.add(stream)
            stream.parent = None

    def simulate(self):
        current = self.roots
        while current:
            yield {f.url for f in current}

            next = set()
            for f in current:
                next.update(f.children)
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

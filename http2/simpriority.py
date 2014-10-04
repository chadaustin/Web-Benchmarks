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
    def __init__(self, onComplete):
        self.onComplete = onComplete

        self.id = getID()

        self.parent = None
        self.children = []

class H2Connection:
    def __init__(self, clock):
        self.clock = clock
        self.root = # highest-priority stream
        self.byPriority = {} # priority -> [stream]

    def request(self, url, priority, onComplete):
        priorities = sort(self.byPriority.keys())

        if priority > max(priority):
            self.roots

        stream = H2Stream(onComplete)
        
        
        #self.byPriority = 

        print('request', url)

    def simulate(self):
        pass

class Prioritizer:
    

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

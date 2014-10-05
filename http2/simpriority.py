import bisect

class Clock:
    def __init__(self):
        self.time = 0

    def advance(self, elapsed):
        self.time += elapsed

class H2Connection:
    def __init__(self, clock):
        self.clock = clock

        self.data = [None]      # (URL, onComplete)
        self.children = [set()] # ID -> set<ID>
        self.parent = [None]    # ID -> ID

    def openStream(self, url, parent, exclusive, onComplete):
        stream = len(self.data)

        assert parent < stream

        self.data.append((url, onComplete))
        self.parent.append(parent)
        if exclusive:
            self.children.append(self.children[parent])
            self.children[parent] = {stream}
        else:
            self.children.append(set())
            self.children[parent].add(stream)

        return stream

    def setPriority(self, stream, parent, exclusive=False):
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
        self.parent[stream] = parent

        if exclusive:
            self.children[stream].update(self.children[parent])
            self.children[parent] = {stream}
        else:
            self.children[parent].add(stream)

    def simulate(self):
        current = self.children[0]
        while current:
            for f in current:
                self.data[f][1]()
            yield {self.data[f][0] for f in current}

            next = set()
            for f in current:
                next.update(self.children[f])
            current = next

class Prioritizer:
    def __init__(self, connection):
        self.connection = connection

        # every entry in stream has the previous entry as a dependency
        self.streams = []
        self.priorities = []

    def request(self, url, priority, onComplete):
        # this algorithm is O(n) as written but could be implemented
        # in O(lg N) with a balancing tree

        priority = -priority # bisect doesn't support using custom comparisons

        index = bisect.bisect(self.priorities, priority)
        self.streams.insert(
            index,
            self.connection.openStream(
                url,
                parent=self.streams[index - 1] if index else 0,
                exclusive=True,
                onComplete=onComplete))
        self.priorities.insert(index, priority)

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
            connection.request(url + '+hires' + str(i), 0 + priorityModifier, cb2)

        # meshes
        def objectVisible():
            cb2()
            onInitialLoad()

        cb1 = after(objectVisible, 20)
        for i in range(10):
            connection.request(url + '+mesh' + str(i), 100 + priorityModifier, cb1)
        for i in range(10):
            connection.request(url + '+lores' + str(i), 100 + priorityModifier, cb1)

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

    def pp(s):
        return ','.join(s)
    print(', '.join(map(pp, conn.simulate())))

if __name__ == '__main__':
    main()

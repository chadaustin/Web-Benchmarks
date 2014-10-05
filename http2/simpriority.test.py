import unittest
import simpriority

class H2ConnectionTests(unittest.TestCase):
    def setUp(self):
        self.conn = simpriority.H2Connection(None)
        self.log = []

    def trace(self, name):
        return lambda: self.log.append(name)

    def openStream(self, url, dependency):
        return self.conn.openStream(url, dependency, self.trace(url))

    def test_simulate_breadth_first(self):
        a = self.openStream('a', 0)
        b = self.openStream('b', 0)
        c = self.openStream('c', 0)

        log = list(self.conn.simulate())
        self.assertEqual([{'a', 'b', 'c'}], log)

    def test_simulate_in_tree_order(self):
        a = self.openStream('a', 0)
        b = self.openStream('b', a)
        c = self.openStream('c', b)

        log = list(self.conn.simulate())
        self.assertEqual([{'a'}, {'b'}, {'c'}], log)

    def test_reprioritize_child(self):
        a = self.openStream('a', 0)
        b = self.openStream('b', a)
        c = self.openStream('c', b)

        self.conn.setPriority(c, a)

        log = list(self.conn.simulate())
        self.assertEqual([{'a'}, {'b', 'c'}], log)

    def test_reprioritize_to_root(self):
        a = self.openStream('a', 0)
        b = self.openStream('b', a)
        c = self.openStream('c', b)

        self.conn.setPriority(c, 0)

        log = list(self.conn.simulate())
        self.assertEqual([{'a', 'c'}, {'b'}], log)

    def test_reprioritize_root_to_child(self):
        a = self.openStream('a', 0)
        b = self.openStream('b', a)
        c = self.openStream('c', b)

        self.conn.setPriority(a, c)

        log = list(self.conn.simulate())
        self.assertEqual([{'c'}, {'a'}, {'b'}], log)

    def test_reprioritize_reorder_child(self):
        a = self.openStream('a', 0)
        b = self.openStream('b', a)
        c = self.openStream('c', b)

        self.conn.setPriority(b, c)

        log = list(self.conn.simulate())
        self.assertEqual([{'a'}, {'c'}, {'b'}], log)

class DisabledSuite:
#class PrioritizerTests(unittest.TestCase):
    def setUp(self):
        self.conn = simpriority.H2Connection(None)
        self.prio = simpriority.Prioritizer(self.conn)

    def request(self, url, priority):
        self.prio.request(url, priority, lambda: None)

    def test_in_request_order(self):
        self.request('a', 0)
        self.request('b', 0)
        self.request('c', 0)

        log = list(self.conn.simulate())
        self.assertEqual([{'a'}, {'c'}, {'b'}], log)

    def test_in_priority_order(self):
        self.request('a', 0)
        self.request('b', 1)
        self.request('c', 2)

        log = list(self.conn.simulate())
        self.assertEqual([{'c'}, {'b'}, {'a'}], log)

if __name__ == '__main__':
    unittest.main()
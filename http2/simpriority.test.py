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

if __name__ == '__main__':
    unittest.main()

import unittest
import simpriority

class H2ConnectionTests(unittest.TestCase):
    def setUp(self):
        self.conn = simpriority.H2Connection(None)
        self.log = []

    def trace(self, name):
        return lambda: self.log.append(name)

    def test_simulate_breadth_first(self):
        a = self.conn.openStream('a', 0, self.trace('a'))
        b = self.conn.openStream('b', 0, self.trace('b'))
        c = self.conn.openStream('c', 0, self.trace('c'))

        log = list(self.conn.simulate())

        self.assertEqual([{'a', 'b', 'c'}], log)

    def test_simulate_in_tree_order(self):
        a = self.conn.openStream('a', 0, self.trace('a'))
        b = self.conn.openStream('b', a, self.trace('b'))
        c = self.conn.openStream('c', b, self.trace('c'))

        log = list(self.conn.simulate())

        self.assertEqual([{'a'}, {'b'}, {'c'}], log)

if __name__ == '__main__':
    unittest.main()

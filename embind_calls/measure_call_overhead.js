(function() {
    var start = Date.now();
    var end = start + 5000;
    var calls = 0;
    while (Date.now() < end) {
        var k = 0;
        for (var i = 0; i < 10000; ++i) {
            k += Module._addf(Module._addi(i, i), Module._addi(i, i));
        }
        calls += 10000 * 3;
    }
    var elapsed = (Date.now() - start) / 1000.0;
    document.getElementById('output').innerHTML += 'calls per second: ' + (calls / elapsed);
})();

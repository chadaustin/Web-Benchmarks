#!/bin/bash

for a in build/clang*; do
    echo -n "$a: "; $a
done

for a in build/gcc*; do
    echo -n "$a: "; $a
done

for a in build/*.js; do
    echo -n "node $a: "; node $a
done

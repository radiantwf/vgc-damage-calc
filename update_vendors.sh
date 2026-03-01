#!/bin/bash
export http_proxy="127.0.0.1:3213"
export https_proxy="127.0.0.1:3213"

rm -rf src/vendors/smogon/damage-calc  src/vendors/smogon/damage-calc-dist src/vendors/smogon/pokemon-showdown
cd src/vendors/smogon
git clone https://github.com/smogon/damage-calc.git
git clone https://github.com/smogon/pokemon-showdown.git
cd ../../..
cp build-calc.sh src/vendors/smogon/damage-calc/
docker run -it --rm -v ./src/vendors/smogon/damage-calc:/app  node:12 /app/build-calc.sh
mv src/vendors/smogon/damage-calc/calc/dist src/vendors/smogon/damage-calc-dist/
rm -rf src/vendors/smogon/damage-calc

export http_proxy=
export https_proxy=
#!/bin/bash

export REPO=pmsipilot/intercom2dw
export TAG=`if [ "$TRAVIS_BRANCH" == "master" ]; then echo "latest"; else echo $TRAVIS_BRANCH ; fi`

docker login -u $DOCKER_USER -p $DOCKER_PASS
docker build -f Dockerfile -t $REPO:$TAG .
docker push $REPO

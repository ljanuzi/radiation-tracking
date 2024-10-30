#!/usr/bin/env bash
# Use this script to test if a given TCP host/port are available

set -e

TIMEOUT=15
QUIET=0

while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -h|--host)
    HOST="$2"
    shift # past argument
    shift # past value
    ;;
    -p|--port)
    PORT="$2"
    shift # past argument
    shift # past value
    ;;
    -t|--timeout)
    TIMEOUT="$2"
    shift # past argument
    shift # past value
    ;;
    -q|--quiet)
    QUIET=1
    shift # past argument
    ;;
    *)
    shift # past argument
    ;;
esac
done

if [ -z "$HOST" ] || [ -z "$PORT" ]; then
    echo "Usage: wait-for-it.sh -h host -p port [-t timeout] [-q]"
    exit 1
fi

wait_for_it() {
  for i in `seq $TIMEOUT` ; do
    if nc -z $HOST $PORT ; then
      if [ $QUIET -ne 1 ]; then
        echo "Host $HOST and port $PORT are available."
      fi
      return 0
    fi
    sleep 1
  done
  echo "Timeout reached, host $HOST and port $PORT are not available."
  return 1
}

wait_for_it

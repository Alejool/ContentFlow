#!/usr/bin/env bash
# wait-for-it.sh: Wait for a service to be available
# Usage: ./wait-for-it.sh host:port [-t timeout] [-- command args]

TIMEOUT=15
QUIET=0
HOST=""
PORT=""

usage() {
    cat << USAGE >&2
Usage:
    $0 host:port [-t timeout] [-- command args]
    -q | --quiet                        Do not output any status messages
    -t TIMEOUT | --timeout=timeout      Timeout in seconds, zero for no timeout
    -- COMMAND ARGS                     Execute command with args after the test finishes
USAGE
    exit 1
}

wait_for() {
    if [[ $TIMEOUT -gt 0 ]]; then
        echo "Waiting $TIMEOUT seconds for $HOST:$PORT"
    else
        echo "Waiting for $HOST:$PORT without a timeout"
    fi
    
    start_ts=$(date +%s)
    while :
    do
        if [[ $QUIET -eq 1 ]]; then
            nc -z "$HOST" "$PORT" > /dev/null 2>&1
        else
            nc -z "$HOST" "$PORT"
        fi
        result=$?
        if [[ $result -eq 0 ]]; then
            end_ts=$(date +%s)
            echo "$HOST:$PORT is available after $((end_ts - start_ts)) seconds"
            break
        fi
        sleep 1
    done
    return $result
}

wait_for_wrapper() {
    if [[ $TIMEOUT -gt 0 ]]; then
        timeout $TIMEOUT $0 --quiet --child --host=$HOST --port=$PORT --timeout=$TIMEOUT &
    else
        $0 --quiet --child --host=$HOST --port=$PORT --timeout=$TIMEOUT &
    fi
    PID=$!
    trap "kill -INT -$PID" INT
    wait $PID
    RESULT=$?
    if [[ $RESULT -ne 0 ]]; then
        echo "Timeout occurred after waiting $TIMEOUT seconds for $HOST:$PORT"
    fi
    return $RESULT
}

# Parse arguments
while [[ $# -gt 0 ]]
do
    case "$1" in
        *:* )
        HOST=$(printf "%s\n" "$1"| cut -d : -f 1)
        PORT=$(printf "%s\n" "$1"| cut -d : -f 2)
        shift 1
        ;;
        -q | --quiet)
        QUIET=1
        shift 1
        ;;
        -t)
        TIMEOUT="$2"
        if [[ $TIMEOUT == "" ]]; then break; fi
        shift 2
        ;;
        --timeout=*)
        TIMEOUT="${1#*=}"
        shift 1
        ;;
        --)
        shift
        break
        ;;
        --help)
        usage
        ;;
        *)
        echo "Unknown argument: $1"
        usage
        ;;
    esac
done

if [[ "$HOST" == "" || "$PORT" == "" ]]; then
    echo "Error: you need to provide a host and port to test."
    usage
fi

wait_for

if [[ $# -gt 0 ]]; then
    exec "$@"
fi

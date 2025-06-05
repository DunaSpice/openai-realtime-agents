# Memgraph Setup Instructions

This repository cannot run Docker containers, so the easiest way to run Memgraph is by extracting the Docker image and using the bundled binaries.

## 1. Download the Docker image

```bash
wget https://download.memgraph.com/memgraph/v2.10.1/docker/memgraph-2.10.1-docker.tar.gz
```

## 2. Extract the image

```bash
mkdir memgraph_docker
 tar -xzf memgraph-2.10.1-docker.tar.gz -C memgraph_docker
 mkdir memgraph_extracted
 for tarfile in $(find memgraph_docker -name layer.tar); do
     tar -xf "$tarfile" -C memgraph_extracted
 done
```

This creates a `memgraph_extracted` directory containing the Memgraph binaries and libraries.

## 3. Start the server

Run the binary with the libraries packaged inside:

```bash
LD_LIBRARY_PATH=$PWD/memgraph_extracted/usr/lib/x86_64-linux-gnu \
    memgraph_extracted/usr/lib/memgraph/memgraph \
    --data-directory=/workspace/memgraph_data \
    --telemetry-enabled=false
```

The server should print a message such as `You are running Memgraph v2.10.1` in the logs.

## 4. Test connectivity

Use `mgconsole` from the extracted files to run a simple query:

```bash
echo "RETURN 1;" | \
  LD_LIBRARY_PATH=$PWD/memgraph_extracted/usr/lib/x86_64-linux-gnu \
    memgraph_extracted/usr/bin/mgconsole --host localhost --port 7687 --username neo4j --password ""
```

This should return a single row confirming the connection.

## 5. Stop the server

When finished, stop the server with `kill` on the Memgraph process ID.


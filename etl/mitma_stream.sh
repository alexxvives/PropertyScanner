#!/bin/sh
# Stream one MITMA day (~250 MB gz) from the public S3 bucket, keep only trips into Madrid/Barcelona districts,
# write data/raw/r19/mitma/agg_YYYYMMDD.json (~16 KB). Nothing raw is stored.  Usage: etl/mitma_stream.sh 20250603
set -e
D=$1; M=$(echo $D | cut -c1-4)-$(echo $D | cut -c5-6)
cd "$(dirname "$0")/../data/raw/r19/mitma"
curl -sf "https://mitma-movilidad-v2.s3.amazonaws.com/estudios_basicos/por-distritos/viajes/ficheros-diarios/$M/${D}_Viajes_distritos.csv.gz" | gunzip | python3 ../../../../etl/mitma_stream_agg.py "$D"

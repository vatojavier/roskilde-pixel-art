FROM postgres:latest

COPY ./data/scripts/init.sql /docker-entrypoint-initdb.d/
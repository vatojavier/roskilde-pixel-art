# roskilde-pixel-art

## Install requirements
1. Install requirements
```
pip install -r requirements.txt
```

1. Install Docker

1. Pull docker image
```
docker pull postgres
```

1. Build docker image
```
docker build -t postgres-roskilde .
```



## Execute

1. Run docker image
```
docker run -d --name pg-roskilde -e POSTGRES_PASSWORD=hahalmao -p 5432:5432 -v $(pwd)/data/db:/var/lib/postgresql/data postgres-roskilde
```

1. Run server
```
python app.py
```

## Database stuff

Access database
```
docker ps
docker exec -it <ID> psql -U postgres
```
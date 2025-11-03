# Docker Commands for Kushon PostgreSQL

## 1. Run PostgreSQL Container
```bash
docker run --name kushon-postgres \
  -e POSTGRES_PASSWORD=kushon123 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=kushon \
  -p 5432:5432 \
  -d postgres:15
```

## 2. Check if container is running
```bash
docker ps
```

## 3. View container logs
```bash
docker logs kushon-postgres
```

## 4. Stop container (when needed)
```bash
docker stop kushon-postgres
```

## 5. Start container again
```bash
docker start kushon-postgres
```

## 6. Remove container (if needed to recreate)
```bash
docker rm kushon-postgres
```

## Database Connection Details:
- Host: localhost
- Port: 5432
- Database: kushon
- User: postgres  
- Password: kushon123
cd project-directory
docker-compose down
docker volume rm $(docker volume ls -q)  # Or use specific volume name
docker-compose up

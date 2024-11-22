#!/bin/bash
export $(xargs < .env)
pg_dump $DATABASE_URL -s -f ./database/init.sql --no-comments
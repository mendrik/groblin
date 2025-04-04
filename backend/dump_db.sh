#!/bin/bash
export $(xargs < .env)
pg_dump $DATABASE_URL -s -f ./database/init.sql --no-comments
pg_dump $DATABASE_URL --data-only --inserts --exclude-table=session --exclude-table=verification -f ./database/test-data.sql
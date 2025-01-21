#!/bin/bash
source ~/.bashrc
fuser -k 5173/tcp
fuser -k 6173/tcp
fuser -k 4001/tcp 
(cd ./frontend && pnpm run dev) &
(cd ./backend && pnpm run server)
wait
